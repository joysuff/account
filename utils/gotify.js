import fetch from "node-fetch";
import { formatDateTime } from './date.js'
async function sendGotifyMessage(config, repayment) {
  try {
    const server_url = config.server_url + "/message";
    const token = config.token;
    const messagePayload = {
      title: `${repayment.item} 账单提醒`,
      message: `
# 账单提醒
\`\`\`
账单名称: ${repayment.item}
账单金额: ${repayment.amount}
上次提醒时间: ${formatDateTime(repayment.last_reminded_at)}
创建时间: ${formatDateTime(repayment.created_at)}
\`\`\`

⚠️ ___请及时处理。避免逾期！___

___💡 消息来自记账系统___
`.trim(),
      priority: 5,
      extras: {
        "client::display": {
          contentType: "text/markdown"
        }
      }
    }
    const res = await fetch(server_url, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        "X-Gotify-Key": token,
      },
      body: JSON.stringify(messagePayload),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    const data = await res.json()
    return {
      id: data.id,
      appid: data.appid,
      title: data.title,
      priority: data.priority,
      date: formatDateTime(new Date(data.date)),
    }
  } catch (err) {
    throw new Error(`Gotify 推送失败：${err.message}`);
  }
}


export { sendGotifyMessage };