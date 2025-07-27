const jwt = require('jsonwebtoken');
const JWT_SECRET = 'joysuff'; // 建议放到环境变量

module.exports = function (req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, msg: '未授权或token无效' });
  }
  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ code: 401, msg: '未授权或token无效' });
  }
}; 