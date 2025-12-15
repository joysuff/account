import notifyModel from '../models/userNotifySettings.js';
import { success, error } from '../utils/response.js';

import log from '../utils/log.js';

// 获取用户所有推送方式
export const getAllNotifyMethods = async (req,res) =>{
    try{
        const userId = req.user.userId;
        const methods = await notifyModel.getAllNotifyMethods(userId);
        return success(res,200,'获取推送方式成功',methods);
    }catch(err){
        log.error('获取所有推送方式接口错误:', err.message);
        return error(res, 500, '获取推送方式失败');
    }
}
// 根据channel_id获取推送方式名称
export const getNotifyMethodNameByChannelId = async (req,res) =>{
    try{
        const {channelId} = req.params;
        const name = await notifyModel.getNotifyMethodNameById(channelId);
        return success(res,200,'获取推送方式名称成功',{name});
        
    }catch(err){
        log.error('获取推送方式名称接口错误:', err.message);
        return error(res, 500, '获取推送方式名称失败');
    }
}
// 获取当前用户启用的推送方式
export const getEnabledNotifyMethod = async (req,res) =>{
    try{
        const userId = req.user.userId;
        const method = await notifyModel.getEnabledNotifyMethod(userId);
        return success(res,200,'获取启用推送方式成功',method);
    }catch(err){
        log.error('获取启用推送方式接口错误:', err.message);
        return error(res, 500, '获取启用推送方式失败');
    }
}
 
// 更新推送配置
export const updateNotifySetting = async (req,res) =>{
    try{
        const userId = req.user.userId;
        const {id} = req.params;
        const {config} = req.body;
        const affectedRows = await notifyModel.updateNotifySetting(id, userId, config);
        if (affectedRows > 0) {
            return success(res, 200, '更新推送配置成功',{ affectedRows });
        } else {
            return error(res, 404, '推送配置未找到');
        }
    }catch(err){
        log.error('更新推送配置接口错误:', err.message);
        return error(res, 500, '更新推送配置失败');
    }
}

// 启用/禁用推送配置
export const setNotifySettingEnabled = async (req,res) =>{
    try{
        const userId = req.user.userId;
        const {id} = req.params;
        const {enabled} = req.body;
        const affectedRows = await notifyModel.setNotifySettingEnabled(userId, id, enabled);
        if (affectedRows > 0) {
            return success(res, 200, '启用/禁用推送配置成功',{ affectedRows });
        } else {
            return error(res, 404, '推送配置未找到');
        }
    }catch(err){
        log.error('启用/禁用推送配置接口错误:', err.message);
        return error(res, 500, '启用/禁用推送配置失败');
    }
}