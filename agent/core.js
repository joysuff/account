/**
 * AI记账Agent核心 — LLM与工具调用的循环
 *
 * 流程：
 *   用户消息 → LLM判断 → 需要工具? → 执行工具 → 结果反馈LLM → 继续循环
 *                      → 不需要?  → 返回最终回复
 */
import OpenAI from "openai";
import dotenv from "dotenv";
import { getSystemPrompt } from "./prompt.js";
import { tools } from "./tool.js";
import { executeTool } from "./tool-exe.js";
import { validateToolCall } from "./safety.js";
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

/**
 * @param {number} userId
 * @param {string} userMessage
 * @param {function} onEvent - 事件回调
 * @param {Array} history - 之前的对话历史（不含system prompt）
 * @returns {{ content: string, messages: Array }} 最终回复 + 完整消息历史
 */
export async function runAgent(userId, userMessage, onEvent, history = []) {
  const messages = [
    { role: "system", content: getSystemPrompt() },
    ...history,
    { role: "user", content: userMessage }
  ];

  for (let i = 0; i < MAX_ITERATIONS; i++) {
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
      if (err.status === 400 && messages.length > 5) {
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
    }

    // 有工具调用
    if (msg.tool_calls?.length) {
      const toolNames = msg.tool_calls.map(tc => tc.function.name).join(", ");
      log.info(`迭代${i + 1} LLM决定调用工具: ${toolNames}`);
    
      const limited = msg.tool_calls.slice(0, 10);  // ← 改名
      if (msg.tool_calls.length > 10) {
        log.warn(`工具调用过多(${msg.tool_calls.length})，仅执行前10个`);
      }
    
      messages.push({ role: "assistant", content: msg.content || null, tool_calls: limited });
    
      for (const tc of limited) {
        const fnName = tc.function.name;
        let fnArgs;
        try { fnArgs = JSON.parse(tc.function.arguments); } catch {
          messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify({ error: "参数解析失败" }) });
          onEvent("tool_error", { name: fnName, error: "参数解析失败" });
          continue;
        }

        onEvent("tool_start", { name: fnName, arguments: fnArgs });

        const err = validateToolCall(fnName, fnArgs);
        if (err) {
          messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify({ error: err }) });
          onEvent("tool_error", { name: fnName, error: err });
          continue;
        }

        try {
          const result = await executeTool(userId, fnName, fnArgs);
          messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(result) });
          onEvent("tool_end", { name: fnName, result });
        } catch (e) {
          log.error(`工具 ${fnName} 执行失败`, e.message);
          messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify({ error: e.message }) });
          onEvent("tool_error", { name: fnName, error: e.message });
        }
      }
    } else {
      // 最终回复 — 返回content和完整历史（去掉system prompt）
      const content = msg.content || "";
      onEvent("done", { content });
      return { content, messages: messages.slice(1) };
    }
  }

  log.warn("Agent达到最大迭代次数");
  const fallback = "抱歉，处理您的请求时遇到了一些问题，请尝试简化描述后重试。";
  onEvent("done", { content: fallback });
  return { content: fallback, messages: messages.slice(1) };
}
