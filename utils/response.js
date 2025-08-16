/**
 * 成功响应
 * @param {object} res - Express 响应对象
 * @param {number} code - 状态码 (默认 0)
 * @param {string} msg - 提示信息
 * @param {any} data - 返回数据
 */
function success(res, code = 0, msg = '操作成功', data = null) {
  res.json({ code, msg, data });
}

/**
 * 错误响应
 * @param {object} res - Express 响应对象
 * @param {number} code - 错误码 (非 0)
 * @param {string} msg - 错误信息
 */
function error(res, code = 500, msg = '操作失败') {
  res.json({ code, msg });
}

export { success, error };