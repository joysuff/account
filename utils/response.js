/**
 * 成功响应
 * @param {object} res - Express 响应对象
 * @param {number} code - 状态码 (默认 200)
 * @param {string} msg - 提示信息
 * @param {any} data - 返回数据
 */
function success(res, code = 200, msg = '操作成功', data = null) {
  res.status(code).json({ code, msg, data });
}

/**
 * 错误响应
 * @param {object} res - Express 响应对象
 * @param {number} code - 错误码 (默认 500)
 * @param {string} msg - 错误信息 (默认 '操作失败')
 */
function error(res, code = 500, msg = '操作失败') {
  res.status(code).json({ code, msg });
}

/**
 * 文件响应
 * @param {object} res - Express 响应对象
 * @param {Buffer} fileData - 文件数据
 * @param {string} fileName - 文件名 (默认 'data.csv')
 * @param {string} contentType - 内容类型 (默认 'text/csv; charset=utf-8')
 */
function file(res,fileData,fileName = 'data.csv',contentType = 'text/csv; charset=utf-8'){
  res.setHeader('Content-Type', contentType);
  res.attachment(fileName);
  res.send(fileData);
}
export { success, error,file };