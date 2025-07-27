const pool = require('../config/db');

function formatDate(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 新增账目
async function addRecord(userId, { category_id, amount, type, date, remark }) {
  const [result] = await pool.query(
    'INSERT INTO records (user_id, category_id, amount, type, date, remark) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, category_id, amount, type, date, remark]
  );
  return result.insertId;
}

// 编辑账目
async function updateRecord(userId, id, { category_id, amount, type, date, remark }) {
  const [result] = await pool.query(
    'UPDATE records SET category_id=?, amount=?, type=?, date=?, remark=? WHERE id=? AND user_id=?',
    [category_id, amount, type, date, remark, id, userId]
  );
  return result.affectedRows;
}

// 删除账目
async function deleteRecord(userId, id) {
  const [result] = await pool.query('DELETE FROM records WHERE id=? AND user_id=?', [id, userId]);
  return result.affectedRows;
}

// 查询账目列表（分页，带分类信息，start/end可选）
async function getRecords(userId, start, end, offset = 0, limit = 10) {
  let sql = `SELECT r.id, r.amount, r.type, r.date, r.remark, 
            c.id as category_id, c.name as category_name, c.type as category_type
     FROM records r
     LEFT JOIN categories c ON r.category_id = c.id
     WHERE r.user_id = ?`;
  const params = [userId];
  if (start) {
    sql += ' AND r.date >= ?';
    params.push(start);
  }
  if (end) {
    sql += ' AND r.date <= ?';
    params.push(end);
  }
  sql += ' ORDER BY r.date DESC, r.id DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  const [rows] = await pool.query(sql, params);
  return rows.map(row => ({
    id: row.id,
    category: { id: row.category_id, name: row.category_name, type: row.category_type },
    amount: row.amount,
    type: row.type,
    date: formatDate(row.date),
    remark: row.remark
  }));
}

// 查询总数（start/end可选）
async function getRecordsCount(userId, start, end) {
  let sql = 'SELECT COUNT(*) as count FROM records WHERE user_id = ?';
  const params = [userId];
  if (start) {
    sql += ' AND date >= ?';
    params.push(start);
  }
  if (end) {
    sql += ' AND date <= ?';
    params.push(end);
  }
  const [rows] = await pool.query(sql, params);
  return rows[0].count;
}

// 根据ID和用户ID获取记录详情
async function getRecordById(userId, id) {
  const sql = `
    SELECT r.*, c.name AS category_name, c.type AS category_type 
    FROM records r 
    LEFT JOIN categories c ON r.category_id = c.id 
    WHERE r.user_id = ? AND r.id = ?
  `;
  const [rows] = await pool.query(sql, [userId, id]);
  if (rows.length === 0) {
    return null;
  }
  const row = rows[0];
  return {
    id: row.id,
    category: { id: row.category_id, name: row.category_name, type: row.category_type },
    amount: row.amount,
    type: row.type,
    date: formatDate(row.date),
    remark: row.remark
  };
}

module.exports = { addRecord, updateRecord, deleteRecord, getRecords, getRecordsCount, getRecordById }; 