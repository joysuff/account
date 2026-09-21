/**
 * 安全检查 — 对LLM工具调用参数进行验证
 * 防止恶意/异常参数直接操作数据库
 */
const MAX_AMOUNT = 100_000_000;   // 1亿元上限
import { getShanghaiDate, getShanghaiMonth, isValidIsoDate } from "../utils/date.js";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_REGEX = /^\d{4}-\d{2}$/;

/** 服务端填充确定性默认值，不能把日期正确性完全交给模型。 */
export function normalizeToolArgs(toolName, args) {
  const normalized = { ...args };
  if (toolName === "add_record" && !normalized.date) normalized.date = getShanghaiDate();
  if (toolName === "get_statistics") {
    if (normalized.type === "daily" && !normalized.date) normalized.date = getShanghaiDate();
    if (normalized.type === "monthly" && !normalized.month) normalized.month = getShanghaiMonth();
  }
  return normalized;
}

export function validateToolCall(toolName, args) {
  switch (toolName) {
    case "get_categories": return null;
    case "add_category":   return validateAddCategory(args);
    case "add_record":     return validateAddRecord(args);
    case "update_record":  return validateUpdateRecord(args);
    case "delete_record":  return validateDeleteRecord(args);
    case "query_records":  return validateQueryRecords(args);
    case "get_statistics": return validateGetStatistics(args);
    default: return "不允许的操作";
  }
}

function validateAddCategory(args) {
  if (!args.name?.trim()) return "分类名称不能为空";
  if (args.name.length > 50) return "分类名称不能超过50个字符";
  if (!["income", "expense"].includes(args.type)) return "分类类型必须是 income 或 expense";
  return null;
}

function validateAddRecord(args) {
  if (!Number.isInteger(args.category_id)) return "分类ID必须是整数";
  const amount = Number(args.amount);
  if (isNaN(amount) || amount <= 0) return "金额必须是大于0的数字";
  if (amount > MAX_AMOUNT) return `金额不能超过${MAX_AMOUNT}元`;
  if (!["income", "expense"].includes(args.type)) return "记录类型必须是 income 或 expense";
  if (!args.date || !DATE_REGEX.test(args.date) || !isValidIsoDate(args.date)) return "日期无效，需要YYYY-MM-DD";
  return null;
}

function validateUpdateRecord(args) {
  if (!Number.isInteger(args.id)) return "记录ID必须是整数";
  if (args.amount !== undefined) {
    const amount = Number(args.amount);
    if (isNaN(amount) || amount <= 0) return "金额必须是大于0的数字";
    if (amount > MAX_AMOUNT) return `金额不能超过${MAX_AMOUNT}元`;
  }
  if (args.type !== undefined && !["income", "expense"].includes(args.type)) return "类型必须是 income 或 expense";
  if (args.date !== undefined && (!DATE_REGEX.test(args.date) || !isValidIsoDate(args.date))) return "日期无效，需要YYYY-MM-DD";
  return null;
}

function validateDeleteRecord(args) {
  if (!Number.isInteger(args.id)) return "记录ID必须是整数";
  return null;
}

function validateQueryRecords(args) {
  if (args.start && (!DATE_REGEX.test(args.start) || !isValidIsoDate(args.start))) return "开始日期格式不正确";
  if (args.end && (!DATE_REGEX.test(args.end) || !isValidIsoDate(args.end))) return "结束日期格式不正确";
  if (args.month && (!MONTH_REGEX.test(args.month) || Number(args.month.slice(5)) < 1 || Number(args.month.slice(5)) > 12)) return "月份格式不正确，需要YYYY-MM";
  if (args.month && (args.start || args.end)) return "month不能与start或end同时使用";
  if (args.start && args.end && args.start > args.end) return "开始日期不能晚于结束日期";
  if (args.type && !["income", "expense"].includes(args.type)) return "筛选类型无效";
  return null;
}

function validateGetStatistics(args) {
  if (!["daily", "monthly", "trend"].includes(args.type)) return "统计类型无效";
  if (args.type === "daily" && (!args.date || !isValidIsoDate(args.date))) return "日统计需要有效date";
  if (args.type === "monthly" && (!args.month || !MONTH_REGEX.test(args.month) || Number(args.month.slice(5)) < 1 || Number(args.month.slice(5)) > 12)) return "月统计需要有效month";
  if (args.type === "trend" && args.days !== undefined && (!Number.isInteger(args.days) || args.days < 1 || args.days > 366)) return "days必须是1到366的整数";
  return null;
}
