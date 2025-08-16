import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost', // 数据库主机
  user: 'root',      // 数据库用户名
  password: '000000', // 数据库密码（请修改为实际密码）
  database: 'accounting',    // 数据库名
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

export default pool; 
