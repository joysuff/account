import recordsModel from '../models/records.js';
import categoriesModel from '../models/categories.js';
import { success, error,file } from '../utils/response.js'
import { formatDateTime } from '../utils/date.js';
import log from '../utils/log.js';

import {Parser} from 'json2csv'

// 新增账目
export const add = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { category_id, amount, type, date, remark } = req.body;
    if (!category_id || !amount || !type || !date) {
      return error(res, 400, '参数不完整');
    }
    // 校验分类类型和账目类型一致
    const category = await categoriesModel.getCategoryById(category_id);

    if (!category) {
      return error(res, 404, '分类不存在');
    }
    if (category.type !== type) {
      return error(res, 422, '分类类型与账目类型不一致');
    }
    const id = await recordsModel.addRecord(userId, { category_id, amount, type, date, remark });
    if (id) {
      return success(res, 201, '添加成功', { id });
    } else {
      return error(res, 500, '添加失败');
    }
  } catch (err) {
    log.error('新增账目接口错误:', err);
    return error(res, 500, '添加失败');
  }

};

// 编辑账目
export const update = async (req, res) => {
  try {
    const userId = req.user.userId;
    const id = req.params.id;
    const { category_id, amount, type, date, remark } = req.body;
    if (!category_id || !amount || !type || !date) {
      return error(res, 400, '参数不完整');
    }
    // 判断要修改的记录是否存在
    const record = await recordsModel.getRecordById(userId, id);
    if (!record) {
      return error(res, 404, '记录不存在');
    }
    // 校验分类是否存在
    const category = await categoriesModel.getCategoryById(category_id);
    if (!category) {
      return error(res, 404, '分类不存在');
    }
    // 校验分类类型和账目类型一致
    if (category.type !== type) {
      return error(res, 422, '分类类型与账目类型不一致');
    }
    const affected = await recordsModel.updateRecord(userId, id, { category_id, amount, type, date, remark });
    if (affected) {
      return success(res, 200, '修改成功');
    } else {
      return error(res, 500, '修改失败或无权限');
    }
  } catch (err) {
    log.error('编辑账目接口错误:', err);
    return error(res, 500, '修改失败');
  }
};

// 删除账目
export const remove = async (req, res) => {
  try {
    const userId = req.user.userId;
    const id = req.params.id;
    const affected = await recordsModel.deleteRecord(userId, id);
    if (affected) {
      return success(res, 200, '删除成功');
    } else {
      return error(res, 500, '删除失败或无权限');
    }
  } catch (err) {
    log.error('删除账目接口错误:', err);
    return error(res, 500, '删除失败');
  }
};

// 查询账目列表（分页，start/end可选）
export const list = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { start, end, page = 1, pageSize = 10 } = req.query;
    const pageNum = parseInt(page) > 0 ? parseInt(page) : 1;
    const size = parseInt(pageSize) > 0 ? parseInt(pageSize) : 10;
    // 计算起始索引
    const offset = (pageNum - 1) * size;
    // 获取总数和分页数据
    const total = await recordsModel.getRecordsCount(userId, start, end);
    const data = await recordsModel.getRecords(userId, start, end, offset, size);
    if (data.length === 0) {
      return success(res,200,'账单记录为空',null)
    }
    return success(res, 200, '获取成功', {
      total,
      page: pageNum,
      pageSize: size,
      totalPages: Math.ceil(total / size),
      records: data
    });
  } catch (err) {
    log.error('查询账目列表接口错误:', err.message);
    return error(res, 500, '获取失败');
  }

};

// 根据ID获取记录详情
export const getById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const id = req.params.id;
    if(!id){
      return error(res,400,'参数不完整');
    }
    const record = await recordsModel.getRecordById(userId, id);
    if (!record) {
      return error(res, 404, '记录不存在');
    }
    return success(res, 200, '获取成功', record);
  } catch (err) {
    log.error('根据ID获取记录详情接口错误:', err.message);
    return error(res, 500, '获取失败');
  }
};

// 导出收支记录
export const exportCsv = async (req,res) => {
  try{
    const userId = req.user.userId;
    const {start,end} = req.query;
    if(!start || !end){
      return error(res,400,'参数不完整');
    }
    const total = await recordsModel.getRecordsCount(userId,start,end);
    const records = await recordsModel.getRecords(userId,start,end,0,total);
    if(records.length === 0){
      return error(res,404,'没有数据');
    }
    const fields = [
      {label:'日期',value:'date'},
      {label:'分类',value: row => row.category.name},
      {label:'金额',value:'amount'},
      {label:'类型',value:'type'},
      {label:'备注',value: row => row.remark || '无备注'},
    ]
    const parser = new Parser({fields});
    const csv = parser.parse(records);
    // 加入BOM头
    const csvWithBom = '\uFEFF' + csv;
    const fileName = `records_${formatDateTime(new Date())}.csv`;
    log.info(`导出csv文件: ${fileName}`);
    return file(res,csvWithBom,fileName)
  }catch(err){
    log.error('导出csv接口错误:', err.message);
    return error(res, 500, '导出失败');
  }
}