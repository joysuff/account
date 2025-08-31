import { aiAnalysis } from '../utils/ai.js';
import statisticsModel from '../models/statistics.js'
import { initSSE, sendSSE, closeSSE, sendError } from '../utils/sse.js';

// 分析某天的收支情况
export const daily = async (req, res) => {
    try {
        initSSE(res);
        const userID = req.user.userId;
        const { date } = req.query;
        if (!date) {
            sendError(res, new Error('日期参数缺失'));
            return;
        }
        const data = await statisticsModel.getDailyStatistics(userID, date);
        if (data.records.length === 0) {
            sendSSE(res, 'message', `${date}日无数据`);
            return;
        }
        const fullContent = await aiAnalysis(data, `用户${date}一天的账单记录`, (delta) => {
            sendSSE(res, 'analysis', { content: delta });
        });
        sendSSE(res, 'end', { content: fullContent });
    } catch (err) {
        sendError(res, err);
        console.error("分析某天的收支情况失败:", err);
    } finally {
        closeSSE(res);
    }
}
// 分析某月账单
export const monthly = async (req, res) => {
    try {
        initSSE(res);
        const userId = req.user.userId;
        const { month } = req.query;
        if (!month) {
            sendError(res, new Error("缺少月份参数"));
            return;
        }
        const incomeData = await statisticsModel.getCategoryStatistics(userId, month, 'income');
        const expenseData = await statisticsModel.getCategoryStatistics(userId, month, 'expense');
        if (incomeData.length === 0 && expenseData.length === 0) {
            sendSSE(res, "message", `${month}月无收入支出账单`);
            return;
        }
        const analysisData = {
            'incomeData': incomeData.length > 0 ? incomeData : "暂无收入数据",
            'expenseData': expenseData.length > 0 ? expenseData : "暂无支出数据"
        }
        console.log(analysisData);
        const fullContent = await aiAnalysis(analysisData, `用户${month}月的收支数据`, (delta) => {
            sendSSE(res, 'analysis', { content: delta })
        })
        sendSSE(res, 'end', { content: fullContent });
    } catch (err) {
        sendError(res, err);
        console.error('分析某月收支情况失败', err);
    } finally {
        closeSSE(res);
    }
}
// 分析最近n天收支数据
export const recent = async (req, res) => {
    try {
        initSSE(res);
        const userId = req.user.userId;
        const days = parseInt(req.query.days) || 7;
        if (days < 0) {
            sendError(res, new Error('最近天数不能为负数'));
            return;
        }
        const data = await statisticsModel.getTrendStatistics(userId, parseInt(days));
        if (data.length === 0) {
            sendSSE(res, 'message', `最近${days}天无数据`);
            return;
        }
        const fullContent = await aiAnalysis(data, `最近${days}天的收支数据`, (delta) => {
            sendSSE(res, 'analysis', { content: delta })
        });
        sendSSE(res, 'end', { content: fullContent });

    } catch (err) {
        sendError(res, err);
        console.error('分析最近n天收支数据失败', err);
    } finally {
        closeSSE(res);
    }
}