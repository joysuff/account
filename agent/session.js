/**
 * Agent会话管理 — 内存存储多轮对话历史
 */
const sessions = new Map();
const TTL = 30 * 60 * 1000; // 30分钟过期

// 每10分钟清理过期会话
setInterval(() => {
  const now = Date.now();
  for (const [id, s] of sessions) {
    if (now - s.lastAccess > TTL) sessions.delete(id);
  }
}, 10 * 60 * 1000);

/** 创建新会话，返回sessionId */
export function createSession(userId) {
  const id = `${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  sessions.set(id, { userId, messages: [], lastAccess: Date.now() });
  return id;
}

/** 获取会话，校验userId，过期返回null */
export function getSession(id, userId) {
  const s = sessions.get(id);
  if (!s || s.userId !== userId) return null;
  if (Date.now() - s.lastAccess > TTL) {
    sessions.delete(id);
    return null;
  }
  s.lastAccess = Date.now();
  return s;
}

/** 删除会话 */
export function deleteSession(id) {
  sessions.delete(id);
}
