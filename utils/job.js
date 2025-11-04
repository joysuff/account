import cron from "node-cron";
import { sendEmail } from "./email.js";
import { formatDateTime } from "./date.js";
import rePaymentModel from "../models/rePayments.js";
import userNotifyModel from "../models/userNotifySettings.js";
import { sendGotifyMessage } from "./gotify.js";
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
          const config = method.config;
          const name = method.method_name;
          switch (name) {
            case "gotify":
              // 发送gotify消息
              const res = await sendGotifyMessage(config, repayment);
              console.log("gotify推送结果", res);
              break;
            case "email":
              // 发送邮件
              await sendEmail(repayment);
              break;
            default:
              console.log("未匹配到推送方式");
          }
          // 更新提醒时间
          const last_reminded_at = new Date().toLocaleString("zh-CN", {
            timeZone: "Asia/Shanghai",
          });
          await rePaymentModel.updateRecurringPaymentLastRemindedAt(
            userId,
            id,
            last_reminded_at
          );
          console.log("提醒时间", last_reminded_at);
        }
      },
      {
        scheduled: true, // 立即开始调度
        timezone: "Asia/Shanghai", // 时区设置为东八区
      }
    );
    tasks.set(id, { task, userId, day_of_month });
    return task.getStatus();
  } catch (err) {
    console.error(err);
    return "定时任务创建失败";
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

export default {
  createMonthlyReminder,
  getTaskStatus,
  cancelMonthlyReminder,
  runTask,
  deleteMonthlyReminder,
  getTask,
  startMonthlyReminder,
};
