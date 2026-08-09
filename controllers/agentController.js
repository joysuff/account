/**
 * AI记账Agent控制器
 */
import { runAgent } from "../agent/core.js";
import { createSession, getSession } from "../agent/session.js";
import { initSSE, sendSSE, closeSSE, sendError } from "../utils/sse.js";
import log from "../utils/log.js";

export const chat = async (req, res) => {
  try {
    initSSE(res);
    const userId = req.user.userId;
    const { message, sessionId } = req.body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      sendError(res, new Error("消息不能为空"));
      return;
    }

    log.info(`Agent收到用户${userId}消息: ${message.trim()}`);

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

    // 运行Agent，传入历史消息
    const result = await runAgent(
      userId,
      message.trim(),
      (eventType, data) => {
        if (eventType === "done") {
          sendSSE(res, "message", { content: data.content });
          sendSSE(res, "end", { content: data.content });
        } else {
          sendSSE(res, eventType, data);
        }
      },
      session.messages
    );

    // 保存本轮更新后的消息历史
    session.messages = result.messages;
    session.lastAccess = Date.now();

  } catch (err) {
    sendError(res, err);
    log.error("Agent聊天失败:", err.message);
  } finally {
    closeSSE(res);
  }
};
