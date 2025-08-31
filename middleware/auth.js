import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import {success,error} from '../utils/response.js'
dotenv.config();
const { JWT_SECRET } = process.env;

export default function (req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) {
    return error(res,401,'未授权或token无效');
  }
  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('token认证错误: ',err);
    return error(res,401,'未授权或token无效');
  }
}; 