import pool from './config/db.js';
import notifyModel from './models/userNotifySettings.js';

async function init() {
  try {
    // 创建 notify_channels 数据
    console.log('初始化notify_channels数据表');
    const notifyMethods = [
      { name: 'email', display_name: '系统邮件', config_schema: {} },
      { name: 'gotify', display_name: 'Gotify 推送', config_schema: { server_url: '', token: '' } }
    ];

    for (const method of notifyMethods) {
      const exists = await pool.query('SELECT id FROM notify_channels WHERE name = ?', [method.name]);
      if (!exists[0].length) {
        await notifyModel.addNotifyMethod(method.name, method.display_name, method.config_schema);
      }
    }

    console.log('✅ 系统初始化完成');

    process.exit(0);
  } catch (err) {
    console.error('初始化失败', err);
    process.exit(1);
  }
}

init();
