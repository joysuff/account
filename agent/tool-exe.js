/**
 * 工具执行层 — 将LLM的工具调用映射到实际的数据库操作
 * 复用现有的 models 层，保证数据操作逻辑一致
 */
import recordsModel from "../models/records.js";
import categoriesModel from "../models/categories.js";
import statisticsModel from "../models/statistics.js";
import { getMonthRange, getShanghaiDate } from "../utils/date.js";

export async function executeTool(userId, name, args) {
  switch (name) {
    case "get_categories": return getCategories(userId);
    case "add_category":   return addCategory(userId, args);
    case "add_record":     return addRecord(userId, args);
    case "query_records":  return queryRecords(userId, args);
    case "update_record":  return updateRecord(userId, args);
    case "delete_record":  return deleteRecord(userId, args);
    case "get_statistics": return getStatistics(userId, args);
    default: throw new Error(`未知工具: ${name}`);
  }
}

async function getCategories(userId) {
  const categories = await categoriesModel.getCategories(userId);
  return { categories };
}

async function addCategory(userId, { name, type }) {
  const existing = await categoriesModel.findCategory(userId, name, type);
  if (existing) {
    return { error: `分类"${name}"（${type === "income" ? "收入" : "支出"}）已存在`, id: existing.id };
  }
  const id = await categoriesModel.addCategory(userId, name, type);
  return { id, name, type, message: `分类"${name}"创建成功` };
}

async function addRecord(userId, { category_id, amount, type, date, remark }) {
  const category = await categoriesModel.getCategoryById(userId, category_id);
  if (!category) return { error: `分类ID ${category_id} 不存在` };
  if (category.type !== type) {
    return { error: `分类"${category.name}"的类型(${category.type})与记录类型(${type})不匹配` };
  }
  const id = await recordsModel.addRecord(userId, { category_id, amount, type, date, remark });
  return {
    id, category_name: category.name, amount, type, date, remark: remark || "",
    message: `已记录：${date} ${category.name} ${type === "income" ? "+" : "-"}${amount}元`
  };
}

async function queryRecords(userId, { start, end, month, type, page = 1, pageSize = 50 }) {
  if (month) ({ start, end } = getMonthRange(month));
  const size = Math.min(Math.max(1, parseInt(pageSize) || 50), 100);
  const pageNum = Math.max(1, parseInt(page) || 1);
  const offset = (pageNum - 1) * size;
  const total = await recordsModel.getRecordsCount(userId, start, end, type);
  const records = await recordsModel.getRecords(userId, start, end, offset, size, type);
  return { total, page: pageNum, pageSize: size, totalPages: Math.ceil(total / size), hasMore: offset + records.length < total, records };
}

async function updateRecord(userId, { id, ...updates }) {
  const existing = await recordsModel.getRecordById(userId, id);
  if (!existing) return { error: `记录ID ${id} 不存在或无权限修改` };
  const merged = {
    category_id: updates.category_id ?? existing.category.id,
    amount: updates.amount ?? existing.amount,
    type: updates.type ?? existing.type,
    date: updates.date ?? existing.date,
    remark: updates.remark !== undefined ? updates.remark : existing.remark
  };
  if (updates.category_id) {
    const category = await categoriesModel.getCategoryById(userId, updates.category_id);
    if (!category) return { error: `分类ID ${updates.category_id} 不存在` };
    if (category.type !== merged.type) return { error: "分类类型与记录类型不匹配" };
  }
  const affected = await recordsModel.updateRecord(userId, id, merged);
  return affected ? { id, ...merged, message: "记录修改成功" } : { error: "修改失败" };
}

async function deleteRecord(userId, { id }) {
  const existing = await recordsModel.getRecordById(userId, id);
  if (!existing) return { error: `记录ID ${id} 不存在或无权限删除` };
  const affected = await recordsModel.deleteRecord(userId, id);
  return affected
    ? { id, message: `已删除记录：${existing.date} ${existing.category.name} ${existing.amount}元` }
    : { error: "删除失败" };
}

async function getStatistics(userId, { type, date, month, days }) {
  switch (type) {
    case "daily": {
      if (!date) return { error: "日统计需要提供date参数" };
      return { type: "daily", date, ...(await statisticsModel.getDailyStatistics(userId, date)) };
    }
    case "monthly": {
      if (!month) return { error: "月统计需要提供month参数" };
      return { type: "monthly", month, ...(await statisticsModel.getMonthlyStatistics(userId, month)) };
    }
    case "trend": {
      const n = days || 7;
      return { type: "trend", days: n, today: getShanghaiDate(), data: await statisticsModel.getTrendStatistics(userId, n) };
    }
    default: return { error: `不支持的统计类型: ${type}` };
  }
}
