const pool = require('../config/db');

// 获取用户所有分类
async function getCategories(userId) {
  const [rows] = await pool.query('SELECT id, name, type FROM categories WHERE user_id = ?', [userId]);
  return rows;
}

// 新增分类
async function addCategory(userId, name, type) {
  const [result] = await pool.query('INSERT INTO categories (user_id, name, type) VALUES (?, ?, ?)', [userId, name, type]);
  return result.insertId;
}

// 删除分类
async function deleteCategory(userId, id) {
  const [result] = await pool.query('DELETE FROM categories WHERE id = ? AND user_id = ?', [id, userId]);
  return result.affectedRows;
}

// 查重
async function findCategory(userId, name, type) {
  const [rows] = await pool.query('SELECT * FROM categories WHERE user_id = ? AND name = ? AND type = ?', [userId, name, type]);
  return rows[0];
}

// 通过id获取分类
async function getCategoryById(id) {
  const pool = require('../config/db');
  const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
  return rows[0];
}

module.exports = { getCategories, addCategory, deleteCategory, findCategory };
module.exports.getCategoryById = getCategoryById; 