import statisticsModel from '../models/statistics.js';


// 当天/指定日期收支统计（含明细和汇总）
export const daily = async (req, res) => {
  const userId = req.user.userId;
  const { date } = req.query;
  if (!date) return res.json({ code: 3002, msg: '缺少日期参数' });
  const data = await statisticsModel.getDailyStatistics(userId, date);

  res.json({ code: 0, msg: '获取成功', data });
};

// 每月收支总额
export const monthly = async (req, res) => {
  const userId = req.user.userId;
  const { month } = req.query;
  if (!month) return res.json({ code: 3003, msg: '缺少月份参数' });
  const data = await statisticsModel.getMonthlyStatistics(userId, month);

  res.json({ code: 0, msg: '获取成功', data });
};

// 按分类消费占比（饼图数据）
export const category = async (req, res) => {
  const userId = req.user.userId;
  const { month, type } = req.query;
  if (!month || !type) return res.json({ code: 3004, msg: '缺少参数' });
  const data = await statisticsModel.getCategoryStatistics(userId, month, type);

  res.json({ code: 0, msg: '获取成功', data });
};

// 近N天收支趋势
export const trend = async (req, res) => {
  const userId = req.user.userId;
  const days = parseInt(req.query.days) || 7; // 默认 7 天
  const data = await statisticsModel.getTrendStatistics(userId, parseInt(days));
  if (data.length === 0) {
    res.json({ code: 3005, msg: '最近' + days + '天没有数据' });
  } else {
    res.json({ code: 0, msg: '获取成功', data });
  }
}; 