const userModel = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'joysuff'; // 建议放到环境变量

// 注册
exports.register = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.json({ code: 1001, msg: '用户名和密码不能为空' });
  }
  const user = await userModel.findByUsername(username);
  if (user) {
    return res.json({ code: 1001, msg: '用户名已存在' });
  }
  const hash = await bcrypt.hash(password, 10);
  const userId = await userModel.createUser(username, hash);
  res.json({ code: 0, msg: '注册成功', data: { userId } });
};

// 登录
exports.login = async (req, res) => {
  const { username, password } = req.body;
  const user = await userModel.findByUsername(username);
  if (!user) {
    return res.json({ code: 1002, msg: '用户名或密码错误' });
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.json({ code: 1002, msg: '用户名或密码错误' });
  }
  const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '2h' });
  res.json({ code: 0, msg: '登录成功', data: { token } });
};

// 获取当前登录用户信息
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await userModel.findById(userId);
    
    if (!user) {
      return res.status(404).json({ code: 1004, msg: '用户不存在' });
    }
    
    // 不返回密码等敏感信息
    const { password, ...userInfo } = user;
    
    res.json({ 
      code: 0, 
      msg: '获取用户信息成功', 
      data: userInfo 
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ code: 1005, msg: '获取用户信息失败' });
  }
};