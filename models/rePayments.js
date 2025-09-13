import pool from '../config/db.js';

// 查询周期性缴费记录
async function getRecurringPayments(userId) {
  const [rows] = await pool.query(
    'SELECT * FROM repayments WHERE user_id = ? ORDER BY id DESC',
    [userId]
  );
  return rows;
}

// 查询周期性缴费具体信息
async function getRecurringPaymentById(userId, id) {
  const [rows] = await pool.query(
    'SELECT * FROM repayments WHERE user_id = ? AND id = ?',
    [userId, id]
  );
  return rows[0];
}

// 新增周期性支出记录
async function addRecurringPayment(userId, data) {
  const [rows] = await pool.query(
    `INSERT INTO repayments (user_id,category_id,item,amount,day_of_month,email,enabled,last_reminded_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      data.category_id,
      data.item,
      data.amount,
      data.day_of_month,
      data.email,
      data.enabled,
      data.last_reminded_at || null,
    ]
  );
  return rows.insertId;
}

// 删除周期性支出记录
async function deleteRecurringPayment(userId, id) {
  const [rows] = await pool.query(
    'DELETE FROM repayments WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return rows.affectedRows;
}
// 更新周期性支出记录
async function updateRecurringPayment(userId, id, data) {
  const [rows] = await pool.query(
    'UPDATE repayments SET category_id = ?,item = ?,amount = ?,day_of_month = ?,email = ?,enabled = ?,last_reminded_at = ? WHERE id = ? AND user_id = ?',
    [
      data.category_id,
      data.item,
      data.amount,
      data.day_of_month,
      data.email,
      data.enabled,
      data.last_reminded_at || null,
      id,
      userId,
    ]
  );
  return rows.affectedRows;
}
// 启用/禁用周期性支出记录
async function updateRecurringPaymentEnabled(userId, id, enabled) {
  const [rows] = await pool.query(
    'UPDATE repayments SET enabled = ? WHERE id = ? AND user_id = ?',
    [enabled, id, userId]
  );
  return rows.affectedRows;
}
// 更新周期性支出记录的最后提醒时间
async function updateRecurringPaymentLastRemindedAt(userId, id, last_reminded_at) {
  const [rows] = await pool.query(
    'UPDATE repayments SET last_reminded_at = ? WHERE id = ? AND user_id = ?',
    [last_reminded_at, id, userId]
  );
  return rows.affectedRows;
}

export default{ getRecurringPayments, addRecurringPayment, deleteRecurringPayment, updateRecurringPayment, getRecurringPaymentById, updateRecurringPaymentEnabled,updateRecurringPaymentLastRemindedAt};
