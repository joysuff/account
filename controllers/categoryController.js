import categoriesModel from '../models/categories.js';

// 获取分类列表
export const list = async (req, res) => {
  const userId = req.user.userId;
  const data = await categoriesModel.getCategories(userId);

  res.json({ code: 0, msg: '获取成功', data });
};

// 新增分类
export const add = async (req, res) => {
  const userId = req.user.userId;
  const { name, type } = req.body;
  if (!name || !type) {
    return res.json({ code: 2001, msg: '分类名称和类型不能为空' });
  }
  const exist = await categoriesModel.findCategory(userId, name, type);
  if (exist) {
    return res.json({ code: 2001, msg: '分类已存在' });
  }
  const id = await categoriesModel.addCategory(userId, name, type);
  res.json({ code: 0, msg: '添加成功', data: { id, name, type } });
};

// 删除分类
export const remove = async (req, res) => {
  const userId = req.user.userId;
  const id = req.params.id;
  const affected = await categoriesModel.deleteCategory(userId, id);

  if (affected) {
    res.json({ code: 0, msg: '删除成功' });
  } else {
    res.json({ code: 2002, msg: '删除失败或无权限' });
  }
};
// 修改分类
export const update = async (req, res) => {
  const userId = req.user.userId;
  const id = req.params.id;
  const { name, type } = req.body;
  if (!name || !type) {
    return res.json({ code: 2001, msg: '分类名称和类型不能为空' });
  }
  const exist = await categoriesModel.findCategory(userId, name, type);
  if (exist) {
    return res.json({ code: 2001, msg: '分类已存在' });
  }
  const category = await categoriesModel.getCategoryById(id);
  if (!category) {
    return res.json({ code: 2002, msg: '分类不存在' });
  }
  if (category.user_id !== userId) {
    return res.json({ code: 2002, msg: '无权限修改' });
  }
  const affected = await categoriesModel.updateCategory(userId, id, name, type);

  if (affected) {
    res.json({ code: 0, msg: '修改成功', data: { id, name, type } });
  } else {
    res.json({ code: 2002, msg: '修改失败或无权限' });
  }
};


