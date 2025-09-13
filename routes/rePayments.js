import express from 'express';
const router = express.Router();
import auth from '../middleware/auth.js';
import {
    getRecurringPayments, addRecurringPayment, deleteRecurringPayment,
    updateRecurringPayment, getRecurringPaymentById, updateRecurringPaymentEnabled, executeRecurringPayment,
    startStopRecurringPayment
} from '../controllers/rePaymentController.js';

// 查询周期性支出记录
router.get('/repayments', auth, getRecurringPayments);
// 新增周期性支出记录并创建定时任务
router.post('/repayments', auth, addRecurringPayment);
// 删除周期性支出记录并销毁定时任务
router.delete('/repayments/:id', auth, deleteRecurringPayment);
// 更新周期性支出记录并更新定时任务
router.put('/repayments/:id', auth, updateRecurringPayment);
// 查询周期性支出具体信息
router.get('/repayments/:id', auth, getRecurringPaymentById);
// 启用/禁用任务
router.put('/repayments/enabled/:id', auth, updateRecurringPaymentEnabled);
// 执行定时任务
router.post('/repayments/execute/:id', auth, executeRecurringPayment);
// 启动/停止定时任务
router.post('/repayments/startstop/:id', auth, startStopRecurringPayment);


export default router;