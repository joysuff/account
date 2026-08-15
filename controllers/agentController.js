/**
 * AI记账Agent控制器
 *
 * 支持两阶段确认流程：
 *   1. 普通请求（无 confirmId）：运行 Agent，若命中写操作（update/delete），
 *      通过 SSE 的 confirm 事件请求用户确认，并挂起执行状态到 session.pending。
 *   2. 确认请求（带 confirmId + action）：恢复挂起状态，按用户决策继续执行或取消，
 *      全程在当前 SSE 连接内完成并流式输出最终回复。
 */
import { runAgent, resumeAgent } from "../agent/core.js";
import { createSession, getSession } from "../agent/session.js";
import { initSSE, sendSSE, closeSSE, sendError } from "../utils/sse.js";
import log from "../utils/log.js";

/** 构造转发给前端的 SSE 事件回调（text→message、done→end） */
function makeSseHandler(res) {
  return (eventType, data) => {
    if (eventType === "text") {
      // 最终回复的流式增量 —— 逐块推给前端，实现逐字输出
      sendSSE(res, "message", { content: data.delta });
    } else if (eventType === "done") {
      // 回复结束，end 事件仅作为结束信号
      sendSSE(res, "end", {});
    } else {
      sendSSE(res, eventType, data);
    }
  };
}

export const chat = async (req, res) => {
  try {
    initSSE(res);
    const userId = req.user.userId;
    const { message, sessionId, confirmId, action } = req.body;

    // 获取或创建会话
    let session;
    if (sessionId) {
      session = getSession(sessionId, userId);
    }
    if (!session) {
      const newId = createSession(userId);
      session = getSession(newId, userId);
      // 通知前端新的sessionId
      sendSSE(res, "session", { sessionId: newId });
    }

    const onEvent = makeSseHandler(res);

    // 阶段二：用户在确认框做出决策后恢复执行
    if (confirmId) {
      const pending = session.pending;
      if (!pending || pending.confirmId !== confirmId) {
        sendError(res, new Error("确认已过期或不存在，请重新发起请求"));
        return;
      }
      const decision = action === "confirm" ? "confirm" : "cancel";
      log.info(`Agent确认操作: ${decision} (${pending.confirmId})`);

      const result = await resumeAgent(userId, pending, decision, onEvent, pending.iteration ?? 0);

      // 恢复执行完成后清除挂起状态并更新历史
      if (result.status === "done") {
        session.messages = result.messages;
        session.pending = null;
      } else if (result.status === "pending") {
        // 恢复过程中又遇到新的写操作，继续挂起（理论上单次确认不会连续命中，但保持健壮）
        session.pending = result.pending;
        session.messages = result.messages;
      }
      session.lastAccess = Date.now();
      return;
    }

    // 阶段一：常规对话请求
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      sendError(res, new Error("消息不能为空"));
      return;
    }

    log.info(`Agent收到用户${userId}消息: ${message.trim()}`);

    const result = await runAgent(userId, message.trim(), onEvent, session.messages);

    if (result.status === "pending") {
      // 命中写操作：挂起，等待前端确认。会话历史保留到此时为止（不含未完成的工具调用）
      session.pending = result.pending;
      session.messages = result.messages;
      session.lastAccess = Date.now();
    } else {
      // 正常完成
      session.messages = result.messages;
      session.pending = null;
      session.lastAccess = Date.now();
    }
  } catch (err) {
    sendError(res, err);
    log.error("Agent聊天失败:", err.message);
  } finally {
    closeSSE(res);
  }
};
