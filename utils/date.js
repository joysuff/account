/**
 * 生成当前本地时间字符串，格式 YYYY-MM-DD_HH-MM-SS
 * @returns {string} 时间字符串，例如 '2025-08-27_23-39-45'
 */
function getLocalDateTimeString() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}_${hh}-${mi}-${ss}`;
}

export { getLocalDateTimeString };