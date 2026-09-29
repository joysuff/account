import pool from '../config/db.js';

// 根据用户名查找用户
async function findByUsername(username) {
  const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
  return rows[0];
}
// 创建新用户
async function createUser(username, password) {
  const [result] = await pool.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, password]);
  return result.insertId;
}

// 根据id查找用户
async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0];
}
// 删除用户
async function deleteUser(id) {
  const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
  return result.affectedRows > 0;
}
// 更新用户密码
async function updateUser(id, password) {
  const [result] = await pool.query('UPDATE users SET password=? WHERE id=?', [password, id]);
  return result.affectedRows > 0;
}

// 获取当前用户的 token 累计用量
async function getTokenUsage(id) {
  const [rows] = await pool.query('SELECT input_tokens, output_tokens, total_tokens FROM users WHERE id = ?', [id]);
  return rows[0] || { input_tokens: 0, output_tokens: 0, total_tokens: 0 };
}

// 累加用户 token 用量（一次请求结束后调用）
async function addTokenUsage(id, { input_tokens = 0, output_tokens = 0, total_tokens = 0 }) {
  const [result] = await pool.query(
    'UPDATE users SET input_tokens = input_tokens + ?, output_tokens = output_tokens + ?, total_tokens = total_tokens + ? WHERE id = ?',
    [input_tokens, output_tokens, total_tokens, id]
  );
  return result.affectedRows;
}

export default { findByUsername, createUser, findById, deleteUser, updateUser, getTokenUsage, addTokenUsage };

