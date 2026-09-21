// 格式化时间至 YYYY-MM-DD HH:mm:ss
function formatDateTime(date){
  if (!date) return null; 
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth()+1).padStart(2,'0');
  const dd = String(date.getDate()).padStart(2,'0');
  const hh = String(date.getHours()).padStart(2,'0');
  const mi = String(date.getMinutes()).padStart(2,'0');
  const ss = String(date.getSeconds()).padStart(2,'0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}
// 格式化时间
function formatDate(date) {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** 当前上海日期，避免 Node 进程、数据库与 Agent 使用不同的时区。 */
function getShanghaiDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(now);
}

function getShanghaiMonth(now = new Date()) {
  return getShanghaiDate(now).slice(0, 7);
}

function getMonthRange(month) {
  if (!/^\d{4}-\d{2}$/.test(month)) return null;
  const [year, value] = month.split('-').map(Number);
  if (value < 1 || value > 12) return null;
  const lastDay = new Date(Date.UTC(year, value, 0)).getUTCDate();
  return { start: `${month}-01`, end: `${month}-${String(lastDay).padStart(2, '0')}` };
}

function isValidIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export { formatDateTime, formatDate, getShanghaiDate, getShanghaiMonth, getMonthRange, isValidIsoDate };
