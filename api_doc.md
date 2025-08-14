## 一、数据库设计

### 1. 用户表（users）

| 字段名      | 类型         | 说明         |
| ----------- | ------------ | ------------ |
| id          | INT PK AI    | 用户ID       |
| username    | VARCHAR(50)  | 用户名       |
| password    | VARCHAR(255) | 密码（加密） |
| created_at  | DATETIME     | 注册时间     |

### 2. 分类表（categories）

| 字段名      | 类型         | 说明         |
| ----------- | ------------ | ------------ |
| id          | INT PK AI    | 分类ID       |
| user_id     | INT          | 所属用户ID   |
| name        | VARCHAR(50)  | 分类名称     |
| type        | ENUM         | 类型（income/expense）|
| created_at  | DATETIME     | 创建时间     |

### 3. 账目表（records）

| 字段名      | 类型         | 说明         |
| ----------- | ------------ | ------------ |
| id          | INT PK AI    | 账目ID       |
| user_id     | INT          | 所属用户ID   |
| category_id | INT          | 分类ID       |
| amount      | DECIMAL(10,2)| 金额         |
| type        | ENUM         | 类型（income/expense）|
| date        | DATE         | 账目日期     |
| remark      | VARCHAR(255) | 备注         |
| created_at  | DATETIME     | 创建时间     |

---


# 记账系统后端接口文档

## 通用返回格式

```json
{
  "code": 0, // 0表示成功，非0表示失败
  "msg": "操作成功",
  "data": {} // 返回数据内容
}
```

---

## 1. 用户管理

### 1.1 注册
- **POST** `/api/register`
- **请求参数：**
  ```json
  {
    "username": "test",
    "password": "123456"
  }
  ```
- **成功返回：**
  ```json
  {
    "code": 0,
    "msg": "注册成功",
    "data": { "userId": 1 }
  }
  ```
- **失败返回：**
  ```json
  {
    "code": 1001,
    "msg": "用户名已存在"
  }
  ```

### 1.2 登录
- **POST** `/api/login`
- **请求参数：**
  ```json
  {
    "username": "test",
    "password": "123456"
  }
  ```
- **成功返回：**
  ```json
  {
    "code": 0,
    "msg": "登录成功",
    "data": { "token": "jwt_token" }
  }
  ```
- **失败返回：**
  
  ```json
  {
    "code": 1002,
    "msg": "用户名或密码错误"
  }
  ```

---

### 1.3 获取用户信息

- `GET /api/profile`

- 请求参数：当前登录用户token

- 成功返回：

  ```json
  {
      "code": 0,
      "msg": "获取用户信息成功",
      "data": {
          "id": 2,
          "username": "test",
          "created_at": "2025-07-25T16:30:26.000Z"
      }
  }
  ```

- 失败返回：

  ```json
  {
    "code": 401,
    "msg": "未授权或token无效"
  }
  ```

## 2. 分类管理

### 2.1 获取分类列表
- **GET** `/api/categories`
- **请求参数：**（JWT鉴权，获取当前用户）
- **成功返回：**
  ```json
  {
    "code": 0,
    "msg": "获取成功",
    "data": [
      { "id": 1, "name": "餐饮", "type": "expense" },
      { "id": 2, "name": "工资", "type": "income" }
    ]
  }
  ```

### 2.2 新增分类
- **POST** `/api/categories`
- **请求参数：**
  ```json
  {
    "name": "交通",
    "type": "expense"
  }
  ```
- **成功返回：**
  ```json
  {
    "code": 0,
    "msg": "添加成功",
    "data": { "id": 3 }
  }
  ```
- **失败返回：**
  ```json
  {
    "code": 2001,
    "msg": "分类已存在"
  }
  ```

### 2.3 删除分类
- **DELETE** `/api/categories/:id`
- **成功返回：**
  ```json
  {
    "code": 0,
    "msg": "删除成功"
  }
  ```

---

## 3. 账目管理

### 3.1 新增账目
- **POST** `/api/records`
- **请求参数：**
  ```json
  {
    "category_id": 1,
    "amount": 100,
    "type": "expense",
    "date": "2024-06-01",
    "remark": "午餐"
  }
  ```
- **成功返回：**
  ```json
  {
    "code": 0,
    "msg": "添加成功",
    "data": { "id": 10 }
  }
  ```

### 3.2 编辑账目
- **PUT** `/api/records/:id`
- **请求参数：**
  ```json
  {
    "category_id": 2,
    "amount": 200,
    "type": "income",
    "date": "2024-06-01",
    "remark": "工资"
  }
  ```
- **成功返回：**
  ```json
  {
    "code": 0,
    "msg": "修改成功"
  }
  ```

### 3.3 删除账目
- **DELETE** `/api/records/:id`
- **成功返回：**
  ```json
  {
    "code": 0,
    "msg": "删除成功"
  }
  ```

### 3.4 查看账目列表（分页，按日期排序）
- **GET** `/api/records?page=1&pageSize=10`
- **请求参数：**
  - start：起始日期（可选）
  - end：结束日期（可选）
  - page：页码（可选，默认1）
  - pageSize：每页条数（可选，默认10）
- **说明：**
  - 不传 start 和 end 时，查询所有账目。
  - 传递 start 或 end 时，按日期范围筛选。
- **成功返回：**
  ```json
  {
    "code": 0,
    "msg": "获取成功",
    "data": {
      "total": 25,
      "page": 1,
      "pageSize": 10,
      "totalPages": 3,
      "records": [
        {
          "id": 1,
          "category": { "id": 1, "name": "餐饮", "type": "expense" },
          "amount": 100,
          "type": "expense",
          "date": "2024-06-01",
          "remark": "午餐"
        }
      ]
    }
  }
  ```

### 3.5 获取单条记录详情
- **GET** `/api/records/:id`
- **请求参数：**
  - id：记录ID（路径参数）
- **成功返回：**
  ```json
  {
    "code": 0,
    "msg": "获取成功",
    "data": {
      "id": 1,
      "category": { "id": 1, "name": "餐饮", "type": "expense" },
      "amount": 100,
      "type": "expense",
      "date": "2024-06-01",
      "remark": "午餐"
    }
  }
  ```
- **失败返回：**
  ```json
  {
    "code": 3001,
    "msg": "记录不存在"
  }
  ```

---

## 4. 统计报表

### 4.1 当天/指定日期收支统计（含明细和汇总）
- **GET** `/api/statistics/daily?date=2024-06-01`
- **成功返回：**
  ```json
  {
    "code": 0,
    "msg": "获取成功",
    "data": {
      "income": 200,
      "expense": 100,
      "records": [
        {
          "id": 1,
          "category": { "id": 1, "name": "餐饮", "type": "expense" },
          "amount": 100,
          "type": "expense",
          "date": "2024-06-01",
          "remark": "午餐"
        },
        {
          "id": 2,
          "category": { "id": 2, "name": "工资", "type": "income" },
          "amount": 200,
          "type": "income",
          "date": "2024-06-01",
          "remark": "工资"
        }
      ]
    }
  }
  ```
- **失败返回：**
  ```json
  {
    "code": 3001,
    "msg": "无数据"
  }
  ```

### 4.2 每月收支总额
- **GET** `/api/statistics/monthly?month=2024-06`
- **成功返回：**
  ```json
  {
    "code": 0,
    "msg": "获取成功",
    "data": {
      "income": 5000,
      "expense": 3000
    }
  }
  ```

### 4.3 按分类消费占比（饼图数据）
- **GET** `/api/statistics/category?month=2024-06&type=expense`
- **成功返回：**
  ```json
  {
    "code": 0,
    "msg": "获取成功",
    "data": [
      { "category": "餐饮", "amount": 1000 },
      { "category": "购物", "amount": 500 }
    ]
  }
  ```

### 4.4 近7天账目变化（折线图数据）
- **GET** `/api/statistics/trend?days=7`
- **成功返回：**
  ```json
  {
    "code": 0,
    "msg": "获取成功",
    "data": [
      { "date": "2024-06-01", "income": 200, "expense": 100 },
      { "date": "2024-06-02", "income": 0, "expense": 50 }
    ]
  }
  ```

---

## 5. 鉴权说明
- 除注册、登录外，所有接口需通过 JWT 鉴权，token 通过请求头 `Authorization: Bearer <token>` 传递。
- 本系统采用 [jjwt](https://github.com/jwtk/jjwt) 生成和校验 JWT Token，token 需在用户登录后由后端签发，前端请求时在 HTTP Header 中携带。

### 请求示例

```
GET /api/records HTTP/1.1
Host: example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

- 若未携带或 token 无效，接口返回：

```json
{
  "code": 401,
  "msg": "未授权或token无效"
}
```

---

## 6. 错误码说明
- 1001：用户名已存在
- 1002：用户名或密码错误
- 2001：分类已存在
- 3001：无数据
- 其他：自定义 