import pool from '../config/db.js';
import { formatDate } from '../utils/date.js';


// 当天/指定日期收支统计（含明细）
async function getDailyStatistics(userId, date) {
  // 汇总
  const [sumRows] = await pool.query(
    'SELECT type, SUM(amount) as total FROM records WHERE user_id = ? AND date = ? GROUP BY type',
    [userId, date]
  );
  let income = 0, expense = 0;
  sumRows.forEach(row => {
    if (row.type === 'income') income = Number(row.total);
    if (row.type === 'expense') expense = Number(row.total);
  });
  // 明细
  const [records] = await pool.query(
    `SELECT r.id, r.amount, r.type, r.date, r.remark,
            c.id as category_id, c.name as category_name, c.type as category_type
     FROM records r
     LEFT JOIN categories c ON r.category_id = c.id
     WHERE r.user_id = ? AND r.date = ?
     ORDER BY r.id DESC`,
    [userId, date]
  );
  // 格式化明细
  const detail = records.map(row => ({
    id: row.id,
    category: { id: row.category_id, name: row.category_name, type: row.category_type },
    amount: row.amount,
    type: row.type,
    date: formatDate(row.date),
    remark: row.remark
  }));
  return { income, expense, records: detail };
}

// 每月收支总额
async function getMonthlyStatistics(userId, month) {
  const [rows] = await pool.query(
    `SELECT type, SUM(amount) as total FROM records WHERE user_id = ? AND DATE_FORMAT(date, '%Y-%m') = ? GROUP BY type`,
    [userId, month]
  );
  let income = 0, expense = 0;
  rows.forEach(row => {
    if (row.type === 'income') income = Number(row.total);
    if (row.type === 'expense') expense = Number(row.total);
  });
  return { income, expense };
}

// 按分类消费占比（饼图数据）
async function getCategoryStatistics(userId, month, type) {
  const [rows] = await pool.query(
    `SELECT c.name as category, SUM(r.amount) as amount
     FROM records r
     LEFT JOIN categories c ON r.category_id = c.id
     WHERE r.user_id = ? AND r.type = ? AND DATE_FORMAT(r.date, '%Y-%m') = ?
     GROUP BY r.category_id, c.name`,
    [userId, type, month]
  );
  return rows;
}

// 近N天收支趋势
async function getTrendStatistics(userId, days) {
  const [rows] = await pool.query(
    `SELECT date, 
      SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expense
     FROM records
     WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     GROUP BY date
     ORDER BY date DESC
     LIMIT ?`,
    [userId, days-1, days]
  );
  // 格式化日期
  return rows.map(row => ({
    date: formatDate(row.date),
    income: Number(row.income),
    expense: Number(row.expense)
  })).reverse();
}

export default {
  getDailyStatistics,
  getMonthlyStatistics,
  getCategoryStatistics,
  getTrendStatistics
}; 