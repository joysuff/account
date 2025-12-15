import cron from "node-cron";
import { sendEmail } from "./email.js";
import { formatDateTime } from "./date.js";
import rePaymentModel from "../models/rePayments.js";
import userNotifyModel from "../models/userNotifySettings.js";
import { sendGotifyMessage } from "./gotify.js";
import log from "./log.js";
/* 
 # ┌────────────── second (optional)
 # │ ┌──────────── minute
 # │ │ ┌────────── hour
 # │ │ │ ┌──────── day of month
 # │ │ │ │ ┌────── month
 # │ │ │ │ │ ┌──── day of week
 # │ │ │ │ │ │
 # │ │ │ │ │ │
 # * * * * * *
*/
const tasks = new Map();
// 创建定时任务
function createMonthlyReminder(userId, id, day_of_month) {
  try {
    // 推送时间固定为9点
    const task = cron.schedule(
      `00 09 ${day_of_month} * *`,
      async () => {
        try {
          // 获取Id对应的记录
          const repayment = await rePaymentModel.getRecurringPaymentById(
            userId,
            id
          );
          // 判断repayment是否为空对象
          if (repayment && Object.keys(repayment).length > 0) {
            // 获取推送方式和配置
            const method = await userNotifyModel.getEnabledNotifyMethod(
              repayment.user_id
            );
            if (!method) {
              log.warn(`用户[${repayment.user_id}]没有启用任何推送方式`);
              return;
            }
            const config = method.config;
            const name = method.method_name;
            switch (name) {
              case "gotify":
                // 发送gotify消息
                const gotifyRes = await sendGotifyMessage(config, repayment);
                // console.log("gotify推送结果", res)
                log.info("Gotify推送结果:", gotifyRes);
                break;
              case "email":
                // 发送邮件
                const emailRes = await sendEmail(repayment);
                log.info("邮件发送结果:", emailRes);
                break;
              default:
                log.warn(`未知推送方式：${name}`);
            }
            // 更新提醒时间
            const last_reminded_at = formatDateTime(new Date());
            await rePaymentModel.updateRecurringPaymentLastRemindedAt(
              userId,
              id,
              last_reminded_at
            );
          }
        } catch (err) {
          log.error(`定时任务执行失败：${err.message}`);
        }
      },
      {
        scheduled: true, // 立即开始调度
        timezone: "Asia/Shanghai", // 时区设置为东八区
      }
    );
    tasks.set(id, { task, userId, day_of_month });
    log.table(`新增定时任务[${id}]成功，当前所有定时任务如下:`, getAllTasks());
    return task.getStatus();
  } catch (err) {
    // console.error(err);
    // return "定时任务创建失败";
    throw new Error(`定时任务创建失败：${err.message}`);
  }
}

// 查看任务状态
function getTaskStatus(id) {
  const data = tasks.get(id);
  if (!data) {
    return "定时任务未创建";
  }
  const task = data.task;
  return task.getStatus();
}

// 停止定时任务
function cancelMonthlyReminder(id) {
  const data = tasks.get(id);
  if (!data) {
    return "定时任务未创建";
  }
  const task = data.task;
  task.stop();
  log.table(`停止定时任务[${id}]成功，当前所有定时任务如下:`, getAllTasks());
  return "定时任务已停止";
}
// 启动定时任务
function startMonthlyReminder(id) {
  const data = tasks.get(id);
  if (!data) {
    return "定时任务未创建";
  }
  const task = data.task;
  task.start();
  log.table(`启动定时任务[${id}]成功，当前所有定时任务如下:`, getAllTasks());
  return "定时任务已启动";
}
// 删除定时任务
function deleteMonthlyReminder(id) {
  const data = tasks.get(id);
  if (!data) {
    return "未找到定时任务";
  }
  const task = data.task;
  task.stop();
  task.destroy();
  tasks.delete(id);
  log.table(`删除定时任务[${id}]成功，当前所有定时任务如下:`, getAllTasks());
  return "定时任务已删除";
}
// 执行任务
function runTask(id) {
  const data = tasks.get(id);
  if (!data) {
    return "定时任务未创建";
  }
  const task = data.task;
  if (task.getStatus() === "stopped") {
    return "定时任务已停止,启动之后执行";
  }
  task.execute();
  return "定时任务已执行";
}

// 查询单一任务
function getTask(id) {
  const data = tasks.get(id);
  if (!data) {
    return false;
  }
  const { task, userId, day_of_month } = data;
  return { task, userId, day_of_month };
}
// 查询所有任务
function getAllTasks() {
  const allTasks = [];
  for (const [id, data] of tasks.entries()) {
    const { task, userId, day_of_month } = data;
    allTasks.push({ id, task, userId, day_of_month });
  }
  return allTasks.map((taskData) => ({
    id: taskData.id,
    userId: taskData.userId,
    day_of_month: taskData.day_of_month,
    taskName: taskData.task.name,
    cronExpression: taskData.task.cronExpression,
    status: taskData.task.getStatus(),
  }));
}

export default {
  createMonthlyReminder,
  getTaskStatus,
  cancelMonthlyReminder,
  runTask,
  deleteMonthlyReminder,
  getTask,
  startMonthlyReminder,
  getAllTasks,
};
