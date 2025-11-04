import statisticsModel from '../models/statistics.js';
import { success, error } from '../utils/response.js'
// 当天/指定日期收支统计（含明细和汇总）
export const daily = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { date } = req.query;
    if (!date) return error(res, 400, '缺少日期参数');
    const data = await statisticsModel.getDailyStatistics(userId, date);
    if (data.records.length === 0) return success(res, 200, date + '没有数据',null);
    return success(res, 200, '获取成功', data);
  } catch (err) {
    console.error('获取指定日期收支统计接口错误:', err);
    return error(res, 500, '获取失败');
  }
};

// 每月收支总额
export const monthly = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { month } = req.query;
    if (!month) return error(res, 400, '缺少月份参数');
    const data = await statisticsModel.getMonthlyStatistics(userId, month);
    return success(res, 200, '获取成功', data);
  } catch (err) {
    console.error('获取指定月份收支统计接口错误:', err);
    return error(res, 500, '获取失败');
  }
};

// 按分类消费占比（饼图数据）
export const category = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { month, type } = req.query;
    if (!month || !type) return error(res, 400, '缺少月份或类型参数');
    const data = await statisticsModel.getCategoryStatistics(userId, month, type);
    if (data.length === 0) return success(res, 200, month + '月没有数据',null);
    return success(res, 200, '获取成功', data);
  } catch (err) {
    console.error('按分类消费占比接口错误:', err);
    return error(res, 500, '获取失败');
  }
};

// 近N天收支趋势
export const trend = async (req, res) => {
  try {
    const userId = req.user.userId;
    const days = parseInt(req.query.days) || 7;
    if (days < 0) return error(res, 400, '最近天数不能为负数');
    const data = await statisticsModel.getTrendStatistics(userId, parseInt(days));
    if (data.length === 0) return success(res, 200, '最近' + days + '天没有数据',null);
    return success(res, 200, '获取成功', data);
  } catch (err) {
    console.error('近N天收支趋势接口错误:', err);
    return error(res, 500, '获取失败');
  }
}; 