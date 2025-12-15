import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { response } from "express";

dotenv.config();

async function sendEmail(data) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_AUTHORIZATION_CODE,
    },
  });

  const htmlContent = `
  <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width:600px; margin:0 auto; padding:40px 20px; background:#f0fff0; /* 整体背景 */">

    <div style="
      background: rgba(255, 255, 255, 0.5); /* 半透明白色背景 */
      backdrop-filter: blur(10px); /* 关键的毛玻璃模糊效果 */
      -webkit-backdrop-filter: blur(10px); /* 兼容性前缀 */
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.3); /* 柔和边框 */
      box-shadow: 0 8px 32px 0 rgba(100, 100, 100, 0.1); /* 轻微阴影 */
      overflow: hidden;
    ">
      
      <div style="background: rgba(144, 238, 144, 0.7); /* 浅绿色半透明 */ color:#333; padding:18px 25px; border-bottom: 1px solid rgba(255, 255, 255, 0.5);">
        <h2 style="margin:0; font-size:22px; font-weight:600;">周期性支出提醒</h2>
      </div>

      <div style="padding:25px;">
        <table style="width:100%; border-collapse:collapse; font-size:15px; color:#333;">
          <thead>
            <tr style="border-bottom: 2px solid #aaddaa; /* 浅绿色分隔线 */">
              <th style="padding:12px; text-align:left; color:#38761d;">项目</th>
              <th style="padding:12px; text-align:right; color:#38761d;">金额</th>
              <th style="padding:12px; text-align:center; color:#38761d;">周期</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding:15px 12px; border-bottom:1px solid #e6f7e6; /* 更浅的分隔线 */ font-weight:bold;">${data.item}</td>
              <td style="padding:15px 12px; border-bottom:1px solid #e6f7e6; text-align:right; color:#a0522d; font-weight:600;">¥${data.amount}</td>
              <td style="padding:15px 12px; border-bottom:1px solid #e6f7e6; text-align:center; color:#6aa84f;">每月${data.day_of_month}日提醒</td>
            </tr>
          </tbody>
        </table>

        <div style="padding-top:30px; text-align:center;">
          <a href="https://record.768451.xyz/repayments" style="
            display:inline-block; 
            padding:12px 25px; 
            background: #6aa84f; /* 主按钮浅绿色 */
            color:white; 
            text-decoration:none; 
            border-radius:25px; /* 圆角胶囊按钮 */
            font-size:16px; 
            font-weight:bold;
            transition: background 0.3s ease; /* 增加过渡效果 */
            box-shadow: 0 4px 10px rgba(106, 168, 79, 0.4); /* 按钮阴影 */
          ">
            查看并管理支出
          </a>
        </div>
      </div>
    </div>

    <p style="font-size:12px; color:#888; text-align:center; margin-top:20px; text-shadow: 0 1px 1px #fff;">
      本提醒邮件由系统自动发送，请勿回复。
    </p>
  </div>
`;

  const mailOptions = {
    from: `"账单助手" <${process.env.EMAIL_USER}>`,
    to: `${data.email}`,
    subject: "💡 周期性支出提醒",
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return {
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
      envelope: info.envelope,
      messageId: info.messageId,
    };
  } catch (err) {
    throw new Error(`邮件发送失败：${err.message}`);
  }
}

export { sendEmail };
