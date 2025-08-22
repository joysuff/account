import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();
const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;

const pool = mysql.createPool({
  host: DB_HOST, // 数据库主机
  user: DB_USER,      // 数据库用户名
  password: DB_PASSWORD, // 数据库密码（请修改为实际密码）
  database: DB_NAME,    // 数据库名
  port: DB_PORT, // 数据库端口
  waitForConnections: true, // 等待连接池中的连接
  connectionLimit: 10, // 连接池最大连接数
  queueLimit: 0, // 连接池最大队列数
  charset: 'utf8mb4'
});

export default pool; 
