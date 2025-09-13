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
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
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
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 

CREATE TABLE repayments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  category_id INT,
  item VARCHAR(50) NOT NULL,           -- 支出名称（房租、会员费等）
  amount DECIMAL(10,2) NOT NULL,       -- 金额
  day_of_month INT NOT NULL,           -- 每月哪天提醒（1~31）
  email VARCHAR(255) NOT NULL,         -- 提醒邮箱
  enabled BOOLEAN DEFAULT TRUE,        -- 是否启用提醒
  last_reminded_at DATETIME DEFAULT NULL,  -- 上次提醒日期
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);