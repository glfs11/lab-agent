# 智能实验室预约系统

基于 **Vue 3 + FastAPI + MySQL** 的实验室预约管理系统，支持学生查看与预约实验室、管理员管理实验室与用户。

> 本项目为个人学习与实践项目，用于完整走通「前端 → 接口 → 数据库」的全栈开发流程。

## 功能

### 已完成

- 用户登录 / 注册页面
- 管理端整体布局（顶部栏 + 侧边导航）
- 登录接口 `POST /api/auth/login`
- **密码使用 bcrypt 哈希存储**（数据库中不保存明文）
- **JWT 登录鉴权**：登录成功后签发 token，受保护接口通过 `get_current_user` 依赖校验身份
- 获取当前登录用户信息接口 `GET /api/user/info`
- 用户账号具备角色区分（`admin` 管理员 / `student` 学生）与启用状态（禁用用户无法登录）
- **统一响应格式**（`Response` 封装 `code / message / data`）与**全局异常处理**
  （业务异常、HTTP 异常、参数校验异常、未捕获异常统一拦截）
- **前端接入后端登录接口**：基于 axios 封装请求层（`utils/request.js`），
  请求拦截器自动携带 `Authorization` 头，响应拦截器统一处理业务错误与 401 失效登出
- **登录态管理**：token 与用户信息持久化到 localStorage，路由守卫拦截未登录访问
- **用户注册接口** `POST /api/auth/register`：校验账号是否重复，密码 bcrypt 哈希后入库，
  默认角色为 `student`
- **Service 业务层**：路由层只负责参数接收与响应封装，业务逻辑下沉至
  `services/auth_service.py`
- CORS 跨域配置（后端显式允许前端源）
- **文件上传接口** `POST /api/files/upload`：后缀白名单校验、大小限制（100MB）、
  UUID 重命名避免冲突、流式写入磁盘，并通过 `/uploads` 静态路由访问
- **个人信息管理**：个人中心页面支持查看与修改资料（名称 / 邮箱 / 手机号 / 头像），
  头像上传后即时预览；后端提供 `GET /api/user/me` 与 `PUT /api/user/me`，
  通过 `user_service` 实现部分字段更新（仅更新提交的字段）
- **修改密码**：`PUT /api/user/password`，校验原密码是否正确、新旧密码不得相同，
  新密码经 bcrypt 重新哈希后入库，修改成功后前端清除登录态并要求重新登录

### 开发中

- 实验室与设备的增删改查
- 预约申请与审核流程

## 技术栈

| 层次 | 技术 |
|---|---|
| 前端 | Vue 3、Vite、Vue Router、Element Plus、Axios |
| 后端 | FastAPI、SQLAlchemy 2.0、Pydantic v2、Uvicorn |
| 认证 | PyJWT（JWT 签发与校验）、bcrypt（密码哈希） |
| 数据库 | MySQL 8（`utf8mb4`） |
| 驱动 | PyMySQL |

## 项目结构

```
lab-agent/
├── backend/                        # 后端服务
│   ├── app/
│   │   ├── api/                    # 路由层（接口定义）
│   │   │   ├── __init__.py         # 汇总各路由，统一挂载 /api 前缀
│   │   │   ├── auth.py             # 登录 / 注册接口
│   │   │   ├── user.py             # 用户信息接口
│   │   │   └── files.py            # 文件上传接口
│   │   ├── services/               # 业务逻辑层
│   │   │   └── auth_service.py     # 登录 / 注册业务处理
│   │   ├── dependencies/           # 依赖注入
│   │   │   └── auth.py             # get_current_user：从 token 解析当前用户
│   │   ├── models/                 # ORM 模型（对应数据库表）
│   │   │   └── user.py             # 用户表
│   │   ├── common/                 # 公共组件
│   │   │   ├── response.py         # 统一响应封装 Response
│   │   │   └── exceptions.py       # 自定义业务异常与全局异常处理器
│   │   ├── schemas/                # 请求 / 响应数据结构
│   │   │   ├── auth.py             # LoginRequest / RegisterRequest / LoginResponse
│   │   │   └── user.py             # UserResponse
│   │   ├── utils/                  # 通用工具
│   │   │   ├── jwt.py              # token 签发与解析
│   │   │   └── password.py         # 密码哈希与校验
│   │   ├── config.py               # 配置加载（读取 .env）
│   │   ├── database.py             # 数据库连接与会话管理
│   │   └── main.py                 # 应用入口
│   ├── requirements.txt            # Python 依赖
│   ├── uploads/                    # 用户上传的文件（运行时生成，不提交）
│   └── .env.example                # 环境变量模板
│
└── frontend/                       # 前端应用
    ├── src/
    │   ├── assets/                 # 静态资源（样式、图片）
    │   ├── layouts/                # 布局组件
    │   │   └── Layout.vue          # 管理端整体框架
    │   ├── views/                  # 页面组件
    │   │   ├── Login.vue
    │   │   ├── Register.vue
    │   │   ├── Home.vue
    │   │   ├── Lab.vue
    │   │   ├── Profile.vue         # 个人中心（资料查看与修改）
    │   │   └── Password.vue        # 修改密码
    │   ├── api/                    # 接口定义
    │   │   ├── auth.js             # 登录 / 注册接口
    │   │   ├── user.js             # 用户信息接口
    │   │   └── file.js             # 文件上传接口
    │   ├── utils/                  # 工具模块
    │   │   ├── request.js          # axios 封装（请求 / 响应拦截器）
    │   │   ├── auth.js             # token 与用户信息的读写清理
    │   │   └── user.js             # 用户信息响应式状态
    │   ├── router/                 # 路由配置
    │   │   └── index.js
    │   ├── main.js                 # 前端入口
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

# 配置环境变量：复制模板并填写数据库信息与 JWT 密钥
copy .env.example .env

# 启动服务
uvicorn app.main:app --reload
```

> **重要**：必须在 `backend` 目录下启动。项目内部使用 `from app.xxx` 形式的绝对导入，
> 换个目录运行会报 `ModuleNotFoundError: No module named 'app'`。
> 若想从项目根目录启动，可改用 `uvicorn app.main:app --reload --app-dir backend`。

**生成 JWT 密钥**（`.env` 中的 `JWT_SECRET_KEY` 务必替换为随机值，不要使用示例值）：

```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

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

| 方法 | 路径 | 说明 | 需要认证 |
|---|---|---|---|
| GET | `/` | 连通性测试 | 否 |
| POST | `/api/auth/login` | 用户登录，返回 JWT token | 否 |
| POST | `/api/auth/register` | 用户注册 | 否 |
| GET | `/api/user/me` | 获取当前登录用户信息 | **是** |
| PUT | `/api/user/me` | 修改当前用户信息 | **是** |
| PUT | `/api/user/password` | 修改密码 | **是** |
| POST | `/api/files/upload` | 文件上传 | 否 |

### 登录

**请求**

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
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "name": "管理员",
      "role": "admin",
      "phone": null,
      "email": null,
      "status": 1
    }
  }
}
```

**失败响应**（账号或密码错误）

```json
{
  "code": 400,
  "message": "账号或密码错误"
}
```

### 携带 token 访问受保护接口

在请求头中加入 `Authorization` 字段：

```
Authorization: Bearer <登录返回的 token>
```

示例：

```powershell
curl http://127.0.0.1:8000/api/user/info -H "Authorization: Bearer 你的token"
```

token 有效期默认 24 小时（由 `.env` 的 `JWT_EXPIRE_HOURS` 控制），过期后需重新登录。

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

`users` 表字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `username` | varchar(50) | 账号，非空 |
| `password` | varchar(255) | bcrypt 哈希值，非空 |
| `name` | varchar(50) | 姓名，非空 |
| `role` | varchar(50) | 角色：`student` / `admin`，非空 |
| `email` | varchar(50) | 邮箱，可空 |
| `phone` | varchar(50) | 手机号，可空 |
| `avatar` | varchar(50) | 头像，可空 |
| `status` | int | 状态：`0` 禁用、`1` 正常 |

> 由于 `create_all` 只创建不存在的表、不会修改已有表结构。若修改了模型字段，
> 需要手动 `DROP TABLE` 后重启服务重建。

### 认证流程

```
POST /api/auth/login
        │  校验账号密码（bcrypt.checkpw）
        ▼
   签发 JWT（payload 含 user_id、exp）
        │  返回给前端
        ▼
前端后续请求携带 Authorization: Bearer <token>
        │
        ▼
get_current_user 依赖：解析 token → 查询用户 → 校验 status
        │
        ▼
    注入到接口函数的 current_user 参数
```

## 已知待改进项

- [ ] `users.username` 增加唯一约束，避免出现同名账号
- [ ] `verify_password` 增加异常兜底，兼容非 bcrypt 格式的历史数据
- [ ] `get_current_user` 在用户不存在时返回 401 而非抛 500
- [ ] 登录失败返回 HTTP 401/403 状态码，而非 `200 + code:400`
- [ ] 密码长度校验（bcrypt 仅处理前 72 字节，超出会报错）
- [ ] 补充角色权限校验（区分学生与管理员可访问的接口）
- [ ] 补充接口单元测试

## License

仅供学习交流使用。
