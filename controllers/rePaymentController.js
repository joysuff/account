import rePaymentModel from '../models/rePayments.js'
import jobTool from '../utils/job.js'
import { success, error } from '../utils/response.js'
import { formatDateTime } from '../utils/date.js'

// 查询周期性支出记录
export const getRecurringPayments = async (req, res) => {
  try {
    const userId = req.user.userId;
    const repayments = await rePaymentModel.getRecurringPayments(userId);
    if (repayments.length === 0) {
      return success(res, 200, '没有周期性支出记录',null);
    }
    /* 
    查看每个任务的状态
    idle: 任务已经创建，未到运行时间
    running: 任务正在运行
    stopped: 任务已经停止
    destroyed: 任务已经销毁（销毁后记录删除不会显示）
    */
    repayments.forEach(repayment => {
      if (repayment.last_reminded_at) {
        repayment.last_reminded_at = formatDateTime(repayment.last_reminded_at);
      }
      repayment.status = jobTool.getTaskStatus(repayment.id);
      repayment.created_at = formatDateTime(repayment.created_at);
    })
    success(res, 200, '查询成功', repayments);
  } catch (err) {
    console.error(err);
    error(res, 500, '查询失败');
  }
}

// 新增周期性支出记录
export const addRecurringPayment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const data = req.body;
    if (!data.category_id || !data.item || !data.amount || !data.day_of_month || !data.email || data.enabled === undefined) {
      return error(res, 400, '参数不完整');
    }
    if (data.day_of_month < 1 || data.day_of_month > 31) {
      return error(res, 400, '日期不合法');
    }
    const id = await rePaymentModel.addRecurringPayment(userId, data);
    let taskStatus = null;
    if (data.enabled === 1) {
      // 新增定时任务
      taskStatus = jobTool.createMonthlyReminder(userId, id, data.day_of_month);
    }
    success(res, 201, '新增成功', { id, taskStatus });
  } catch (err) {
    console.error(err);
    error(res, 500, '新增失败');
  }
}

// 删除周期性支出记录
export const deleteRecurringPayment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const id = Number(req.params.id);
    const rows = await rePaymentModel.deleteRecurringPayment(userId, id);
    if (rows === 0) {
      return error(res, 404, '周期性支出记录不存在');
    }
    // 删除定时任务
    const taskStatus = jobTool.deleteMonthlyReminder(id);
    success(res, 200, '删除成功', { id, taskStatus });
  } catch (err) {
    console.error(err);
    error(res, 500, '删除失败');
  }
}
// 更新周期性支出记录
export const updateRecurringPayment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const id = Number(req.params.id);
    const data = req.body;
    if (!data.category_id || !data.item || !data.amount || !data.day_of_month || !data.email) {
      return error(res, 400, '参数不完整');
    }
    if (data.day_of_month < 1 || data.day_of_month > 31) {
      return error(res, 400, '日期不合法');
    }
    const rows = await rePaymentModel.updateRecurringPayment(userId, id, data);
    if (rows === 0) {
      return error(res, 404, '周期性支出记录不存在');
    }

    // 删除并重新创建任务
    const oldTaskStatus = jobTool.deleteMonthlyReminder(id);
    const newTaskStatus = jobTool.createMonthlyReminder(userId, id, data.day_of_month);
    success(res, 200, '更新成功', { id, oldTaskStatus, newTaskStatus });
  } catch (err) {
    console.error(err);
    error(res, 500, '更新失败');
  }
}

// 查询周期性支出具体信息
export const getRecurringPaymentById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const id = Number(req.params.id);
    if (!id) {
      return error(res, 400, '参数不完整');
    }
    const repayment = await rePaymentModel.getRecurringPaymentById(userId, id);
    if (!repayment) {
      return error(res, 404, '周期性支出记录不存在');
    }
    // 查看任务状态
    if (repayment.last_reminded_at) {
      repayment.last_reminded_at = formatDateTime(repayment.last_reminded_at);
    }
    repayment.status = jobTool.getTaskStatus(id);
    repayment.created_at = formatDateTime(repayment.created_at);
    success(res, 200, '查询成功', repayment);
  } catch (err) {
    console.error(err);
    error(res, 500, '查询失败');
  }
}

// 启用/禁用定时任务
export const updateRecurringPaymentEnabled = async (req, res) => {
  try {
    const userId = req.user.userId;
    const id = Number(req.params.id);
    const enabled = req.body.enabled;
    if (enabled === undefined) {
      return error(res, 400, '参数不完整');
    }
    const rows = await rePaymentModel.updateRecurringPaymentEnabled(userId, id, enabled);
    if (rows === 0) {
      return error(res, 404, '周期性支出记录不存在');
    }
    const data = await rePaymentModel.getRecurringPaymentById(userId, id);
    let taskStatus = null;
    if (enabled === 1) {
      // 新增定时任务
      taskStatus = jobTool.createMonthlyReminder(userId, id,data.day_of_month);
    } else {
      // 禁用定时任务
      taskStatus = jobTool.deleteMonthlyReminder(id);
    }
    // 响应
    success(res, 200, '更新成功', { id, taskStatus });
  } catch (err) {
    console.error(err);
    error(res, 500, '启用/禁用失败');
  }
}

// 执行定时任务
export const executeRecurringPayment = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { task } = jobTool.getTask(id);
    if (!task) {
      return error(res, 404, '定时任务不存在');
    }
    const taskStatus = jobTool.runTask(id);
    return success(res, 200, '执行成功', { id, taskStatus });
  } catch (err) {
    console.error(err);
    error(res, 500, '执行/停止失败');
  }
}

// 启动/停止定时任务
export const startStopRecurringPayment = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const action = req.body.action;
    const { task } = jobTool.getTask(id);
    if (!task) {
      return error(res, 404, '定时任务不存在');
    }
    if(action === 1){
      const taskStatus = jobTool.startMonthlyReminder(id);
      return success(res, 200, '启动成功', { id, taskStatus });
    }else{
      const taskStatus = jobTool.cancelMonthlyReminder(id);
      return success(res, 200, '停止成功', { id, taskStatus });
    }
  } catch (err) {
    console.error(err);
    error(res, 500, '启动/停止失败');
  }
}


