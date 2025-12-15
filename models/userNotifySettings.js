import pool from '../config/db.js';
// 初始化推送方式（仅用于数据库初始化脚本）
async function addNotifyMethod(name, display_name, config_schema) {
    const [result] = await pool.query(
        'INSERT INTO notify_channels (name, display_name, config_schema) VALUES (?, ?, ?)',
        [name, display_name, JSON.stringify(config_schema)]
    );
    return result.insertId;
}
// 初始化推送配置
async function addDefaultNotifySettingForUser(userId) {
    // 查询系统支持的所有通知方式
    const [channels] = await pool.query('SELECT * FROM notify_channels');
    if (!channels.length) {
        return false;
    }
    // 遍历系统通知方式，为用户插入默认配置
    for (const channel of channels) {
        // 插入用户的通知设置
        await pool.query(
            `INSERT IGNORE INTO user_notify_settings (user_id, channel_id, config)
             VALUES (?, ?, ?)`,
            [userId, channel.id,JSON.stringify(channel.config_schema)]
        );
    }
    return true;
}


// 获取用户所有推送方式
async function getAllNotifyMethods(userId) {
    const [rows] = await pool.query('SELECT * FROM user_notify_settings WHERE user_id = ?', [userId]);
    const parsedRows = rows.map(row => ({
        ...row,
        config: typeof row.config === 'string'
            ? JSON.parse(row.config)
            : (row.config || {})
        // config: JSON.parse(row.config || '{}')
    }));

    return parsedRows;
}

// 根据id获取推送名称
async function getNotifyMethodNameById(channelId) {
    const [rows] = await pool.query(
        'SELECT name FROM notify_channels WHERE id = ?',
        [channelId]
    );
    return rows[0].name;
}
// 获取当前启用的推送方式(最多只会返回一条数据)
async function getEnabledNotifyMethod(userId) {
    const [rows] = await pool.query(
        'SELECT * FROM user_notify_settings WHERE user_id = ? AND enabled = 1',
        [userId]
    );
    if (!rows.length) return null; // 没有启用任何推送
    const methodName = await getNotifyMethodNameById(rows[0]?.channel_id);
    const res = {
        id: rows[0].id,
        channel_id: rows[0].channel_id,
        method_name: methodName,
        enabled: rows[0].enabled,
        config: typeof rows[0].config === 'string' ? JSON.parse(rows[0].config) : rows[0].config,
        created_at: rows[0].created_at,
    }
    return res;
}
//添加新的推送配置
async function addNotifySetting(userId, channelId, config) {
    const [result] = await pool.query(
        'INSERT INTO user_notify_settings (user_id, channel_id, config) VALUES (?, ?, ?)',
        [userId, channelId, config]
    );
    return result.insertId;
}

// 更新推送配置
export const updateNotifySetting = async (id, userId, config) => {
    const [result] = await pool.query(
        'UPDATE user_notify_settings SET config = ? WHERE id = ? AND user_id = ?',
        [JSON.stringify(config), id, userId]
    );
    return result.affectedRows;
};
// 删除推送配置
async function deleteNotifySetting(id) {
    const [result] = await pool.query(
        'DELETE FROM user_notify_settings WHERE id = ?',
        [id]
    );
    return result.affectedRows;
}
// 启用/禁用推送配置
async function setNotifySettingEnabled(userId, id, enabled) {
    if (enabled) {
        // 禁用该用户的其他推送方式
        await pool.query(
            'UPDATE user_notify_settings SET enabled = 0 WHERE user_id = ? AND id != ?',
            [userId, id]
        );
        // 启用该推送方式
        const [result] = await pool.query(
            'UPDATE user_notify_settings SET enabled = 1 WHERE id = ?',
            [id]
        );
        return result.affectedRows;
    } else {
        // 直接禁用该推送方式
        const [result] = await pool.query(
            'UPDATE user_notify_settings SET enabled = 0 WHERE id = ?',
            [id]
        );
        return result.affectedRows;
    }

}

export default {
    getAllNotifyMethods,
    getEnabledNotifyMethod,
    addNotifySetting,
    updateNotifySetting,
    deleteNotifySetting,
    addNotifyMethod,
    setNotifySettingEnabled,
    addDefaultNotifySettingForUser,
    getNotifyMethodNameById
}