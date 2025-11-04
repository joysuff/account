import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

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
  <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width:600px; margin:0 auto; padding:20px; background:#f9f9f9;">
    <div style="background:#4a90e2; color:white; padding:16px 20px; border-radius:8px 8px 0 0;">
      <h2 style="margin:0; font-size:20px;">📌 周期性支出提醒</h2>
    </div>
    <div style="background:white; border:1px solid #ddd; border-top:0; border-radius:0 0 8px 8px; overflow:hidden;">
      <table style="width:100%; border-collapse:collapse; font-size:14px; color:#333;">
        <thead style="background:#f0f4f8;">
          <tr>
            <th style="padding:12px; text-align:left;">项目</th>
            <th style="padding:12px; text-align:right;">金额</th>
            <th style="padding:12px; text-align:center;">周期</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:12px; border-bottom:1px solid #eee;">${data.item}</td>
            <td style="padding:12px; border-bottom:1px solid #eee; text-align:right;">¥${data.amount}</td>
            <td style="padding:12px; border-bottom:1px solid #eee; text-align:center;">每月${data.day_of_month}日提醒</td>
          </tr>
        </tbody>
      </table>
      <div style="padding:16px; text-align:center; border-top:1px solid #eee;">
        <a href="https://record.768451.xyz/repayments" style="display:inline-block; padding:10px 20px; background:#4a90e2; color:white; text-decoration:none; border-radius:4px; font-size:14px;">
          查看详情
        </a>
      </div>
    </div>
    <p style="font-size:12px; color:#999; text-align:center; margin-top:12px;">
      本提醒邮件由系统自动发送，请勿回复。
    </p>
  </div>
  `;

  const mailOptions = {
    from: `"账单助手" <${process.env.EMAIL_USER}>`,
    to: `${data.email}`,
    subject: '💡 周期性支出提醒',
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('邮件发送结果:', info.messageId);
  } catch (err) {
    console.error('邮件发送失败:', err);
  }
}

export { sendEmail };
