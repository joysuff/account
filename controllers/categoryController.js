const categoryModel = require('../models/categories');

// 获取分类列表
exports.list = async (req, res) => {
  const userId = req.user.userId;
  const data = await categoryModel.getCategories(userId);
  res.json({ code: 0, msg: '获取成功', data });
};

// 新增分类
exports.add = async (req, res) => {
  const userId = req.user.userId;
  const { name, type } = req.body;
  if (!name || !type) {
    return res.json({ code: 2001, msg: '分类名称和类型不能为空' });
  }
  const exist = await categoryModel.findCategory(userId, name, type);
  if (exist) {
    return res.json({ code: 2001, msg: '分类已存在' });
  }
  const id = await categoryModel.addCategory(userId, name, type);
  res.json({ code: 0, msg: '添加成功', data: { id } });
};

// 删除分类
exports.remove = async (req, res) => {
  const userId = req.user.userId;
  const id = req.params.id;
  const affected = await categoryModel.deleteCategory(userId, id);
  if (affected) {
    res.json({ code: 0, msg: '删除成功' });
  } else {
    res.json({ code: 2002, msg: '删除失败或无权限' });
  }
}; 