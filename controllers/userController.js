import userModel from '../models/user.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { success, error } from '../utils/response.js';
import dotenv from 'dotenv';
import notifyModel from '../models/userNotifySettings.js';
import log from '../utils/log.js';

dotenv.config();
const { JWT_SECRET,JWT_EXPIRES_IN } = process.env;

// 注册
export const register = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return error(res, 400, '用户名或密码不能为空')
    }
    const user = await userModel.findByUsername(username);
    if (user) {
      return error(res, 409, '用户名已存在')
    }
    const hash = await bcrypt.hash(password, 10);
    const userId = await userModel.createUser(username, hash);
    // 添加默认推送配置
    const notifyRes = await notifyModel.addDefaultNotifySettingForUser(userId);
    if (!notifyRes) {
        log.error(`用户[${username}]默认推送配置添加失败`);
        const deleteRes = await userModel.deleteUser(userId);
        if (deleteRes) {
            log.info(`用户[${username}]注册失败，已删除用户数据`);
        }
        return error(res, 500, '注册失败，默认推送配置添加失败,请检查是否初始化系统通知方式');
    }
    log.info(`用户[${username}]消息通知配置成功`);
    log.info(`用户[${username}]注册成功`);
    return success(res, 201, '注册成功', { userId });
  } catch (err) {
    log.error('注册接口错误:', err.message);
    return error(res, 500, '注册失败');
  }
};
// 登录
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return error(res, 400, '用户名或密码不能为空')
    }
    const user = await userModel.findByUsername(username);
    if (!user) {
      return error(res, 401, '用户名或密码错误');
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return error(res, 401, '用户名或密码错误');
    }
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    log.info(`用户[${username}]登录成功`);
    return success(res, 200, '登录成功', { token });
  } catch (err) {
    log.error('登录接口错误:', err.message);
    return error(res, 500, '登录失败');
  }

};

// 获取当前登录用户信息
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await userModel.findById(userId);
    if (!user) {
      return success(res, 200, '用户不存在', null);
    }
    // 不返回密码等敏感信息
    const { password, ...userInfo } = user;
    return success(res, 200, '获取用户信息成功', userInfo);
  } catch (err) {
    log.error('获取用户信息失败:', err.message);
    return error(res, 500, '获取用户信息失败');
  }
};