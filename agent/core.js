/**
 * AI记账Agent核心 — LLM与工具调用的循环
 *
 * 流程：
 *   用户消息 → LLM判断 → 需要工具? → (写操作需确认) → 执行工具 → 结果反馈LLM → 继续循环
 *                      → 不需要?  → 返回最终回复
 *
 * update_record / delete_record 属于高风险写操作，执行前会挂起并通过
 * onEvent("confirm", ...) 请求用户确认，确认后方可执行（见 resumeAgent）。
 */
import OpenAI from "openai";
import dotenv from "dotenv";
import { getSystemPrompt } from "./prompt.js";
import { tools } from "./tool.js";
import { executeTool } from "./tool-exe.js";
import { normalizeToolArgs, validateToolCall } from "./safety.js";
import { getShanghaiDate } from "../utils/date.js";
import recordsModel from "../models/records.js";
import categoriesModel from "../models/categories.js";
import userModel from "../models/user.js";
import log from "../utils/log.js";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.API_BASE_URL,
  defaultHeaders: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    'Accept': '*/*',
  }
});

const MAX_ITERATIONS = 10;

// 需要用户确认后才能执行的写操作工具
// 所有改变用户数据的操作均需显式确认；确认不替代服务端授权校验。
const CONFIRM_TOOLS = ["add_category", "add_record", "update_record", "delete_record"];
const INTERNAL_OUTPUT_PATTERN = /(?:系统提示|system prompt|工具(?:名称|列表|定义|schema)|函数(?:名称|列表|定义)|内部(?:函数|工具|提示)|(?:function|tool)\s*(?:call|calling)|\b(?:all|list)\s*(?:tools|functions)\b)/i;
const INTERNAL_REQUEST_PATTERN = /(?:能(?:调用|使用)?什么(?:函数|工具)|列出.*(?:函数|工具)|(?:函数|工具).*(?:列表|名称|定义)|(?:系统提示|prompt).*(?:内容|是什么|给我)|what (?:functions?|tools?) (?:can|do) you|list .*?(?:functions?|tools?)|system prompt)/i;
const INTERNAL_DISCLOSURE_REPLY = "我可以协助分类管理、记账、账单查询和收支统计。请直接告诉我需要处理的账务内容。";

function displayToolName(name) {
  return ({ get_categories: "查看分类", add_category: "创建分类", add_record: "新增账单", query_records: "查询账单", update_record: "修改账单", delete_record: "删除账单", get_statistics: "查看统计" })[name] || "账务操作";
}

function containsInternalOutput(content) {
  return typeof content === "string" && INTERNAL_OUTPUT_PATTERN.test(content);
}

// 取消工具调用时，反馈给 LLM 的结果，让其生成"已取消"之类的回复
function canceledToolResult(fnName) {
  return { canceled: true, note: `用户取消了「${fnName}」操作` };
}

// 判断 LLM 回复文本是否疑似"把工具调用写成了文本"（而非真正的 function calling）
function looksLikeToolCallText(content) {
  if (!content || typeof content !== "string") return false;
  const t = content.toLowerCase();
  return (
    t.includes("<tool_call") ||
    t.includes("<function=") ||
    t.includes("</function>") ||
    (t.includes("<function") && t.includes("</function>")) ||
    /delete_record|update_record|add_record|query_records/.test(t) && /<\w+>/.test(t)
  );
}

/**
 * @param {number} userId
 * @param {string} userMessage
 * @param {function} onEvent - 事件回调 (eventType, data)
 *   除历史事件外，还支持：
 *     - "text" 事件 { delta }：最终回复的流式增量
 *     - "confirm" 事件 { confirmId, name, description, arguments }：请求用户确认写操作
 * @param {Array} history - 之前的对话历史（不含system prompt）
 * @returns {{ status: "done", content: string, messages: Array } | { status: "pending", pending: object, messages: Array }}
 */
export async function runAgent(userId, userMessage, onEvent, history = []) {
  // 不把要求披露内部实现的请求交给模型，避免依赖模型自行遵守保密规则。
  if (INTERNAL_REQUEST_PATTERN.test(userMessage)) {
    await emitAsStream(INTERNAL_DISCLOSURE_REPLY, onEvent);
    onEvent("done", { content: INTERNAL_DISCLOSURE_REPLY });
    return {
      status: "done", content: INTERNAL_DISCLOSURE_REPLY,
      messages: [...history, { role: "user", content: userMessage }, { role: "assistant", content: INTERNAL_DISCLOSURE_REPLY }]
    };
  }
  const messages = [
    { role: "system", content: getSystemPrompt() },
    ...history,
    { role: "user", content: userMessage }
  ];

  return runLoop(userId, messages, onEvent, 0, null);
}

/**
 * 恢复一个被挂起的 Agent 执行：用户对某个写操作做出确认/取消决策后继续跑循环。
 * @param {object} pending - 挂起状态（含 messages 与待执行工具调用）
 * @param {string} decision - "confirm" | "cancel"
 * @param {function} onEvent - 同 runAgent
 * @param {number} iteration - 已用迭代次数（继续计数，防超限）
 */
export async function resumeAgent(userId, pending, decision, onEvent, iteration = 0, carriedUsage = null) {
  const { messages, toolCalls } = pending;
  // 重建 assistant 工具调用消息（格式与 OpenAI 一致）
  const assistantToolCalls = toolCalls.map(tc => ({
    id: tc.id,
    type: "function",
    function: { name: tc.function.name, arguments: tc.function.arguments },
  }));

  if (decision === "confirm") {
    // 用户确认：把工具调用视作 assistant 已发起，逐个正常执行
    messages.push({ role: "assistant", content: null, tool_calls: assistantToolCalls });

    for (const tc of toolCalls) {
      const fnName = tc.function.name;
      let fnArgs;
      try { fnArgs = JSON.parse(tc.function.arguments); } catch { fnArgs = null; }

      if (fnArgs === null) {
        messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify({ error: "参数解析失败" }) });
        onEvent("tool_error", { name: fnName, error: "参数解析失败" });
        continue;
      }

      fnArgs = normalizeToolArgs(fnName, fnArgs);
      onEvent("tool_start", { name: displayToolName(fnName), arguments: fnArgs });

      const err = validateToolCall(fnName, fnArgs);
      if (err) {
        messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify({ error: err }) });
        onEvent("tool_error", { name: displayToolName(fnName), error: err });
        continue;
      }

      try {
        const result = await executeTool(userId, fnName, fnArgs);
        messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(result) });
        onEvent("tool_end", { name: displayToolName(fnName), result });
      } catch (e) {
        log.error(`工具 ${fnName} 执行失败`, e.message);
        messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify({ error: e.message }) });
        onEvent("tool_error", { name: displayToolName(fnName), error: "操作执行失败" });
      }
    }
  } else {
    // 用户取消：把 assistant + tool 结果（取消）回填给 LLM，让它给出"已取消"回复
    messages.push({ role: "assistant", content: null, tool_calls: assistantToolCalls });
    for (const tc of toolCalls) {
      const fnName = tc.function.name;
      messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(canceledToolResult(fnName)) });
      onEvent("tool_canceled", { name: displayToolName(fnName) });
    }
  }

  return runLoop(userId, messages, onEvent, iteration, carriedUsage);
}

/**
 * 挂起前把本轮已消耗的 token 一次性写入用户累计（挂起/取消/失败都不重复统计）。
 */
async function persistUsage(userId, accumulatedUsage) {
  if (!accumulatedUsage || (accumulatedUsage.input + accumulatedUsage.output === 0)) return;
  try {
    await userModel.addTokenUsage(userId, {
      input_tokens: accumulatedUsage.input,
      output_tokens: accumulatedUsage.output,
      total_tokens: accumulatedUsage.total,
    });
  } catch (e) {
    log.error("token用量累加失败:", e.message);
  }
}

/**
 * Agent 核心循环。返回 done（最终回复）或 pending（待用户确认写操作）。
 */
async function runLoop(userId, messages, onEvent, startIteration, accumulatedUsage = null) {
  const usage = accumulatedUsage ? { ...accumulatedUsage } : { input: 0, output: 0, total: 0 };
  for (let i = startIteration; i < MAX_ITERATIONS; i++) {
    let response;
    try {
      response = await client.chat.completions.create({
        model: process.env.API_MODEL,
        messages,
        tools,
        tool_choice: "auto",
      });
    } catch (err) {
      // 400 通常是上下文过长，截断历史后重试一次
      const isContextLengthError = err.code === "context_length_exceeded" || /context.*(?:length|token)|(?:length|token).*context/i.test(err.message || "");
      if (isContextLengthError && messages.length > 5) {
        log.warn(`请求400，上下文过长(${messages.length}条)，截断历史重试`);
        // 保留 system prompt + 最近10条消息
        messages = [messages[0], ...messages.slice(-10)];
        response = await client.chat.completions.create({
          model: process.env.API_MODEL,
          messages,
          tools,
          tool_choice: "auto",
        });
      } else {
        throw err;
      }
    }

    const msg = response.choices[0].message;

    // Token用量
    if (response.usage) {
      log.info(
        `迭代${i + 1} Token: 输入${response.usage.prompt_tokens} | 输出${response.usage.completion_tokens} | 合计${response.usage.total_tokens}`
      );
      usage.input += response.usage.prompt_tokens || 0;
      usage.output += response.usage.completion_tokens || 0;
      usage.total += response.usage.total_tokens || 0;
    }

    // 有工具调用
    if (msg.tool_calls?.length) {
      const toolNames = msg.tool_calls.map(tc => tc.function.name).join(", ");
      log.info(`迭代${i + 1} LLM决定调用工具: ${toolNames}`);

      const limited = msg.tool_calls.slice(0, 10);
      if (msg.tool_calls.length > 10) {
        log.warn(`工具调用过多(${msg.tool_calls.length})，仅执行前10个`);
      }
      // 默认值在确认前固定下来，避免用户跨日确认时账单日期悄然变化。
      const executableCalls = limited.map((tc) => {
        try {
          const argumentsObject = normalizeToolArgs(tc.function.name, JSON.parse(tc.function.arguments));
          return { ...tc, function: { ...tc.function, arguments: JSON.stringify(argumentsObject) } };
        } catch {
          return tc;
        }
      });

      // 本批次是否包含需要确认的写操作
      const hasConfirmTool = limited.some(tc => CONFIRM_TOOLS.includes(tc.function.name));

      if (hasConfirmTool) {
        // 挂起：先请求用户确认，确认后再执行本批次所有工具。
        // 注意：此处尚未 push assistant 消息，messages 保持到上一条历史为止，
        // 恢复时 resumeAgent 会重新 push assistant + tool 结果。
        const confirmId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        // 并发查询每条待确认操作的详细信息，生成人类可读描述 + 结构化记录列表
        const details = await Promise.all(
          executableCalls.map(async (tc) => {
            let args = null;
            try { args = JSON.parse(tc.function.arguments); } catch { args = null; }
            return await describeToolCallDetail(userId, tc.function.name, args);
          })
        );
        const description = details.map(d => d.description).join("\n");
        const records = details.map(d => d.record).filter(Boolean);
        onEvent("confirm", {
          confirmId,
          name: "账务操作",
          description,
          records,
        });
        const pending = { confirmId, messages, toolCalls: executableCalls, iteration: i + 1 };
        await persistUsage(userId, usage);
        return { status: "pending", pending, messages: messages.slice(1), usage };
      }

      // 无确认工具：正常逐工具执行
      messages.push({ role: "assistant", content: msg.content || null, tool_calls: executableCalls });

      for (const tc of executableCalls) {
        const fnName = tc.function.name;
        let fnArgs;
        try { fnArgs = JSON.parse(tc.function.arguments); } catch { fnArgs = null; }

        if (fnArgs === null) {
          messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify({ error: "参数解析失败" }) });
          onEvent("tool_error", { name: fnName, error: "参数解析失败" });
          continue;
        }

        fnArgs = normalizeToolArgs(fnName, fnArgs);
        onEvent("tool_start", { name: displayToolName(fnName), arguments: fnArgs });

        const err = validateToolCall(fnName, fnArgs);
        if (err) {
          messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify({ error: err }) });
          onEvent("tool_error", { name: displayToolName(fnName), error: err });
          continue;
        }

        try {
          const result = await executeTool(userId, fnName, fnArgs);
          messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(result) });
          onEvent("tool_end", { name: displayToolName(fnName), result });
        } catch (e) {
          log.error(`工具 ${fnName} 执行失败`, e.message);
          messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify({ error: e.message }) });
          onEvent("tool_error", { name: displayToolName(fnName), error: "操作执行失败" });
        }
      }
    } else {
      // 防御：模型未走 function calling，却把工具调用以文本形式输出
      // 例如输出 `<tool_call><function=delete_record>...`。此时不能当作最终回复，
      // 需要提示模型改用工具调用并重新生成。
      const rawContent = msg.content || "";
      if (looksLikeToolCallText(rawContent)) {
        log.warn(`迭代${i + 1} 检测到文本化工具调用，要求模型改用 function calling: ${rawContent.slice(0, 80)}`);
        messages.push({ role: "assistant", content: rawContent });
        messages.push({
          role: "user",
          content: "你刚才的回复把工具调用写成了文本（如 <tool_call> 标签）。这是不被允许的。请改用 function calling 工具来执行该操作，不要输出任何形式的工具调用文本。"
        });
        continue;
      }

      // 最终回复 — 此时迭代的 LLM 已生成了完整 content，
      // 无需再调用一次 LLM 重新生成（会带来额外的几秒延迟）。
      // 直接把已生成的内容按小块分片模拟流式输出，实现逐字效果且零额外延迟。
      const content = containsInternalOutput(msg.content) ? INTERNAL_DISCLOSURE_REPLY : (msg.content || "");
      await emitAsStream(content, onEvent);
      messages.push({ role: "assistant", content });
      onEvent("done", { content });
      await persistUsage(userId, usage);
      return { status: "done", content, messages: messages.slice(1), usage };
    }
  }

  log.warn("Agent达到最大迭代次数");
  const fallback = "抱歉，处理您的请求时遇到了一些问题，请尝试简化描述后重试。";
  onEvent("text", { delta: fallback });
  onEvent("done", { content: fallback });
  await persistUsage(userId, usage);
  return { status: "done", content: fallback, messages: messages.slice(1), usage };
}

/**
 * 生成待确认写操作的详情：人类可读描述文本 + 结构化记录信息。
 * @returns {{ description: string, record: object | null }}
 */
async function describeToolCallDetail(userId, fnName, args) {
  if (!args) {
    return { description: `执行「${fnName}」操作`, record: null };
  }
  switch (fnName) {
    case "add_category": {
      const typeLabel = args.type === "income" ? "收入" : args.type === "expense" ? "支出" : "未知";
      const name = args.name || "未提供";
      const description = `创建${typeLabel}分类「${name}」`;
      return {
        description,
        record: {
          action: "新增",
          category: name,
          type: args.type || "expense",
          typeLabel: typeLabel === "未知" ? "支出" : typeLabel,
          remark: "将创建新分类",
        },
      };
    }
    case "add_record": {
      const category = Number.isInteger(args.category_id)
        ? await categoriesModel.getCategoryById(userId, args.category_id)
        : null;
      const categoryLabel = category ? category.name : `ID ${args.category_id ?? "未知"}`;
      const record = {
        action: "新增",
        date: args.date || getShanghaiDate(),
        category: categoryLabel,
        type: args.type || "expense",
        typeLabel: args.type === "income" ? "收入" : "支出",
        amount: `${(args.type === "income" ? "+" : "-")}${args.amount ?? "未提供"}`,
        remark: args.remark || "",
      };
      const description = formatRecordDescription("新增", {
        date: record.date,
        type: record.type,
        amount: String(args.amount ?? "未提供"),
        remark: record.remark || null,
        category: { name: categoryLabel },
      });
      return { description, record };
    }
    case "delete_record": {
      const rec = await recordsModel.getRecordById(userId, args.id);
      if (rec) {
        return {
          description: formatRecordDescription("删除", rec),
          record: { action: "删除", ...stringifyRecord(rec) },
        };
      }
      return {
        description: `删除 ID 为 ${args.id} 的记录（记录不存在或已删除）`,
        record: null,
      };
    }
    case "update_record": {
      const rec = await recordsModel.getRecordById(userId, args.id);
      const base = rec
        ? formatRecordDescription("修改", rec)
        : `修改 ID 为 ${args.id} 的记录（原记录不存在）`;
      const fields = [];
      if (args.amount !== undefined) fields.push(`金额改为 ${args.amount} 元`);
      if (args.category_id !== undefined) fields.push(`分类改为 ID ${args.category_id}`);
      if (args.type !== undefined) fields.push(`类型改为 ${args.type}`);
      if (args.date !== undefined) fields.push(`日期改为 ${args.date}`);
      if (args.remark !== undefined) fields.push(`备注改为「${args.remark}」`);
      const description = fields.length ? `${base}\n变更：${fields.join("、")}` : base;
      return {
        description,
        record: rec ? { action: "修改", ...stringifyRecord(rec), changes: fields.join("、") } : null,
      };
    }
    default:
      return { description: `执行「${fnName}」操作`, record: null };
  }
}

/** 将记录对象转为前后端共用的纯字段形态（金额带正负号，便于前端渲染） */
function stringifyRecord(rec) {
  const sign = rec.type === "income" ? "+" : "-";
  return {
    date: rec.date,
    category: rec.category?.name || "未知",
    type: rec.type,
    typeLabel: rec.type === "income" ? "收入" : "支出",
    amount: `${sign}${rec.amount}`,
    remark: rec.remark || "",
  };
}

/** 将记录详情格式化为可读文本 */
function formatRecordDescription(action, rec) {
  const typeLabel = rec.type === "income" ? "收入" : "支出";
  const sign = rec.type === "income" ? "+" : "-";
  const parts = [
    `日期 ${rec.date}`,
    `分类 ${rec.category?.name || "未知"}`,
    `金额 ${sign}${rec.amount}元（${typeLabel}）`,
  ];
  if (rec.remark) parts.push(`备注「${rec.remark}」`);
  return `${action}记录：${parts.join("，")}`;
}

/**
 * 将已生成的完整回复按小块分片，逐块通过 onEvent("text", { delta }) 推送。
 * 内容早已就绪，分片间加入短延时，实现流畅的"打字机"逐字观感，
 * 同时避免二次调用 LLM 带来的额外延迟。
 */
async function emitAsStream(content, onEvent) {
  const chunkSize = 2;          // 每片字符数
  const delayMs = 40;           // 片间延时
  let idx = 0;
  while (idx < content.length) {
    const chunk = content.slice(idx, idx + chunkSize);
    onEvent("text", { delta: chunk });
    idx += chunkSize;
    if (idx < content.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
