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

export default { findByUsername, createUser, findById, deleteUser };

