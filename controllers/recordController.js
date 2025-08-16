import recordsModel from '../models/records.js';
import categoriesModel from '../models/categories.js';

// 新增账目
export const add = async (req, res) => {
  const userId = req.user.userId;
  const { category_id, amount, type, date, remark } = req.body;
  if (!category_id || !amount || !type || !date) {
    return res.json({ code: 4001, msg: '参数不完整' });
  }
  // 校验分类类型和账目类型一致
  const category = await categoriesModel.getCategoryById(category_id);

  if (!category) {
    return res.json({ code: 4005, msg: '分类不存在' });
  }
  if (category.type !== type) {
    return res.json({ code: 4006, msg: '分类类型与账目类型不一致' });
  }
  const id = await recordsModel.addRecord(userId, { category_id, amount, type, date, remark });

  res.json({ code: 0, msg: '添加成功', data: { id } });
};

// 编辑账目
export const update = async (req, res) => {
  const userId = req.user.userId;
  const id = req.params.id;
  const { category_id, amount, type, date, remark } = req.body;
  if (!category_id || !amount || !type || !date) {
    return res.json({ code: 4001, msg: '参数不完整' });
  }
  // 校验分类类型和账目类型一致
  const category = await categoriesModel.getCategoryById(category_id);
  if (!category) {
    return res.json({ code: 4005, msg: '分类不存在' });
  }
  if (category.type !== type) {
    return res.json({ code: 4006, msg: '分类类型与账目类型不一致' });
  }
  const affected = await recordsModel.updateRecord(userId, id, { category_id, amount, type, date, remark });
  if (affected) {
    res.json({ code: 0, msg: '修改成功' });
  } else {
    res.json({ code: 4002, msg: '修改失败或无权限' });
  }
};

// 删除账目
export const remove = async (req, res) => { 
  const userId = req.user.userId;
  const id = req.params.id;
  const affected = await recordsModel.deleteRecord(userId, id);
  if (affected) {
    res.json({ code: 0, msg: '删除成功' });
  } else {
    res.json({ code: 4003, msg: '删除失败或无权限' });
  }
};

// 查询账目列表（分页，start/end可选）
export const list = async (req, res) => {
  const userId = req.user.userId;
  const { start, end, page = 1, pageSize = 10 } = req.query;
  const pageNum = parseInt(page) > 0 ? parseInt(page) : 1;
  const size = parseInt(pageSize) > 0 ? parseInt(pageSize) : 10;
  const offset = (pageNum - 1) * size;
  // 获取总数和分页数据
  const total = await recordsModel.getRecordsCount(userId, start, end);
  const data = await recordsModel.getRecords(userId, start, end, offset, size);
  res.json({
    code: 0,
    msg: '获取成功',
    data: {
      total,
      page: pageNum,
      pageSize: size,
      totalPages: Math.ceil(total / size),
      records: data
    }
  });
}; 

// 根据ID获取记录详情
export const getById = async (req, res) => {
  const userId = req.user.userId;
  const id = req.params.id;
  const record = await recordsModel.getRecordById(userId, id);
  if (!record) {
    return res.json({ code: 4004, msg: '记录不存在' });
  }
  res.json({ code: 0, msg: '获取成功', data: record });
};

