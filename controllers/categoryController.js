import categoriesModel from '../models/categories.js';
import { success, error } from '../utils/response.js'
// 获取分类列表
export const list = async (req, res) => {
  try {
    const userId = req.user.userId;
    const data = await categoriesModel.getCategories(userId);
    if (!data) {
      return error(res, 404, '没有数据');
    }
    return success(res, 200, '获取成功', data);
  } catch (err) {
    console.error('获取分类列表接口错误:', err);
    return error(res, 500, '获取失败');
  }
};

// 新增分类
export const add = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, type } = req.body;
    if (!name || !type) {
      return error(res, 400, '分类名和类型不能为空');
    }
    const exist = await categoriesModel.findCategory(userId, name, type);
    if (exist) {
      return error(res, 409, '分类已存在');
    }
    const id = await categoriesModel.addCategory(userId, name, type);
    if (id) {
      return success(res, 200, '添加成功', { id, name, type });
    } else {
      return error(res, 500, '添加失败');
    }
  } catch (err) {
    console.error('新增分类接口错误:', err);
    return error(res, 500, '添加失败');
  }
};

// 删除分类
export const remove = async (req, res) => {
  try {
    const userId = req.user.userId;
    const id = req.params.id;
    const affected = await categoriesModel.deleteCategory(userId, id);
    if (affected) {
      return success(res, 200, '删除成功', {id: parseInt(id)});
    } else {
      return error(res, 500, '删除失败或无权限');
    }
  } catch (err) {
    console.error('删除分类接口错误:', err);
    return error(res, 500, '删除失败');
  }
};
// 修改分类
export const update = async (req, res) => {
  try {
    const userId = req.user.userId;
    const id = req.params.id;
    const { name, type } = req.body;
    if (!name || !type) {
      return error(res, 400, '分类名称和类型不能为空');
    }
    const exist = await categoriesModel.findCategory(userId, name, type);
    if (exist) {
      return error(res, 409, '分类名称已存在');
    }
    const category = await categoriesModel.getCategoryById(id);
    if (!category) {
      return error(res, 404, '要修改的分类不存在');
    }
    if (category.user_id !== userId) {
      return error(res, 403, '无权限修改');
    }
    const affected = await categoriesModel.updateCategory(userId, id, name, type);

    if (affected) {
      return success(res, 200, '修改成功', { id, name, type });
    } else {
      return error(res, 500, '修改失败或无权限');
    }
  } catch (err) {
    console.error('修改分类接口错误:', err);
    return error(res, 500, '修改失败');
  }
};


