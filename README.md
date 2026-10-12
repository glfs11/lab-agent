# 智能实验室预约系统

基于 **Vue 3 + FastAPI + MySQL** 的实验室预约管理系统，支持学生查看与预约实验室、管理员管理实验室与用户。

> 本项目为个人学习与实践项目，用于完整走通「前端 → 接口 → 数据库」的全栈开发流程。

## 功能

### 已完成

- 用户登录 / 注册页面
- 管理端整体布局（顶部栏 + 侧边导航）
- 登录接口 `POST /api/auth/login`（账号密码校验、返回用户信息）

### 开发中

- JWT 鉴权（登录后签发 token，接口按角色控制访问）
- 实验室与设备的增删改查
- 预约申请与审核流程

## 技术栈

| 层次 | 技术 |
|---|---|
| 前端 | Vue 3、Vite、Vue Router、Element Plus、Axios |
| 后端 | FastAPI、SQLAlchemy 2.0、Pydantic v2、Uvicorn |
| 数据库 | MySQL 8（`utf8mb4`） |
| 驱动 | PyMySQL |

## 项目结构

```
lab-agent/
├── backend/                    # 后端服务
│   ├── app/
│   │   ├── api/                # 路由层（接口定义）
│   │   │   └── auth.py         # 登录 / 鉴权接口
│   │   ├── models/             # ORM 模型（对应数据库表）
│   │   │   └── user.py         # 用户表
│   │   ├── schemas/            # 请求 / 响应数据结构
│   │   │   ├── auth.py
│   │   │   └── user.py
│   │   ├── config.py           # 配置加载（读取 .env）
│   │   ├── database.py         # 数据库连接与会话管理
│   │   └── main.py             # 应用入口
│   ├── requirements.txt        # Python 依赖
│   └── .env.example            # 环境变量模板
│
└── frontend/                   # 前端应用
    ├── src/
    │   ├── assets/             # 静态资源（样式、图片）
    │   ├── layouts/            # 布局组件
    │   │   └── Layout.vue      # 管理端整体框架
    │   ├── views/              # 页面组件
    │   │   ├── Login.vue
    │   │   ├── Register.vue
    │   │   ├── Home.vue
    │   │   └── Lab.vue
    │   ├── router/             # 路由配置
    │   │   └── index.js
    │   ├── main.js             # 前端入口
    │   └── App.vue
    ├── package.json
    └── vite.config.js
```

## 快速开始

### 环境要求

- Python 3.10+
- Node.js 22.18+ 或 24.12+
- MySQL 8.0+

### 1. 准备数据库

先创建数据库（表结构会在后端启动时自动创建）：

```sql
CREATE DATABASE lab_agent CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. 启动后端

```powershell
cd backend

# 创建并激活虚拟环境
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# 安装依赖
pip install -r requirements.txt

# 配置环境变量：复制模板并填入自己的数据库信息
copy .env.example .env

# 启动服务
uvicorn app.main:app --reload
```

> **重要**：必须在 `backend` 目录下启动。项目内部使用 `from app.xxx` 形式的绝对导入，
> 换个目录运行会报 `ModuleNotFoundError: No module named 'app'`。

后端地址：<http://127.0.0.1:8000>

### 3. 启动前端

```powershell
cd frontend

npm install
npm run dev
```

前端地址：<http://localhost:5173>

## 接口文档

FastAPI 自动生成交互式文档，服务启动后访问：

- Swagger UI：<http://127.0.0.1:8000/docs>
- ReDoc：<http://127.0.0.1:8000/redoc>

### 已实现接口

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/` | 连通性测试 |
| POST | `/api/auth/login` | 用户登录 |

**登录请求示例**

```json
{
  "username": "admin",
  "password": "123456"
}
```

**成功响应**

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "id": 1,
    "username": "admin",
    "name": "管理员",
    "role": "admin",
    "phone": null,
    "email": null,
    "status": 1
  }
}
```

## 开发说明

### 数据库表结构

表由 SQLAlchemy 在应用启动时自动创建（`Base.metadata.create_all`），
新增模型后需要在 `app/main.py` 中导入，否则不会被创建。

所有表继承自 `app/database.py` 的 `Base`，默认包含三个公共字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | int | 主键，自增 |
| `create_time` | datetime | 创建时间 |
| `update_time` | datetime | 更新时间（自动更新） |

### 已知待改进项

- [ ] **密码目前为明文存储与比对**，需改为 `bcrypt` 哈希
- [ ] `users.username` 需增加唯一约束
- [ ] `users.password` 字段长度需扩容（bcrypt 哈希为 60 字符）
- [ ] 登录失败应返回 `401` 而非 `200 + code:400`
- [ ] 补充 JWT 鉴权与角色权限校验
- [ ] 补充接口单元测试

## License

仅供学习交流使用。
