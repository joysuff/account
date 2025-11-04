-- 记账系统数据库初始化脚本
-- 数据库名可自定义，如accounting

CREATE DATABASE IF NOT EXISTS `accounting` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `accounting`;

CREATE TABLE `users` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `categories` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `type` ENUM('income', 'expense') NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_user_category` (`user_id`, `name`, `type`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE  -- 用户删除时同步删除分类
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `records` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `category_id` INT, -- 允许为NULL
  `amount` DECIMAL(10,2) NOT NULL,
  `type` ENUM('income', 'expense') NOT NULL,
  `date` DATE NOT NULL,
  `remark` VARCHAR(255),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,  -- 用户删除时同步删除记账记录
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE -- 分类删除时同步删除相关记账记录
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 

CREATE TABLE repayments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  category_id INT,
  item VARCHAR(50) NOT NULL,           -- 支出名称（房租、会员费等）
  amount DECIMAL(10,2) NOT NULL,       -- 金额
  day_of_month INT NOT NULL,           -- 每月哪天提醒（1~31）
  email VARCHAR(255) NOT NULL,         -- 提醒邮箱
  enabled BOOLEAN DEFAULT FALSE,        -- 是否启用提醒
  last_reminded_at DATETIME DEFAULT NULL,  -- 上次提醒日期
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, -- 关联用户表，用户删除则同步删除
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE -- 关联分类表，分类删除则同步删除
);

-- 通知方式定义表 
CREATE TABLE notify_channels (
  id INT AUTO_INCREMENT PRIMARY KEY,                  
  name VARCHAR(50) NOT NULL UNIQUE,                    -- 通知方式名称（如 gotify、email）
  display_name VARCHAR(100) NOT NULL,                  -- 通知方式展示名称（如 "Gotify 推送"）
  config_schema JSON NOT NULL,                         -- 配置模板
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP        
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;              


-- 用户通知设置表
CREATE TABLE user_notify_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,                   
  user_id INT NOT NULL,                               
  channel_id INT NOT NULL,                             
  config JSON NOT NULL,                                -- 用户填写的通知配置（如 {"url":"https://xxx","token":"abc"}）
  enabled BOOLEAN DEFAULT FALSE,                       -- 是否启用该通知方式，默认不启用
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,       

  UNIQUE KEY uniq_user_channel (user_id, channel_id),  -- 限制同一用户同一通知方式只能有一条记录
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,        -- 关联 users 表，用户删除则同步删除配置
  FOREIGN KEY (channel_id) REFERENCES notify_channels(id) ON DELETE CASCADE -- 关联 notify_channels 表，通知方式删除则同步删除
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;              
