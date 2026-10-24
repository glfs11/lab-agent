# FastAPI + LangGraph 从零开发智能实验室预约系统

基于 **FastAPI + LangGraph + Vue 3 + MySQL** 的全栈 Agent 应用，包含 JWT 鉴权、
预约时段冲突检测、RAG 知识库检索与 ReAct 式 Tool Calling 工作流。

> 本项目为个人学习与实践项目，从零实现「前端 → 接口 → 数据库 → 大模型 Agent」的完整链路。

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
- **用户管理**：用户列表支持分页与关键词模糊搜索（账号 / 名称），
  管理员可新增、编辑、删除用户，并设置角色（学生 / 管理员）与启用状态；
  通过 `get_current_admin` 依赖做管理员权限校验，非管理员访问返回 403
- **实验室管理**：实验室列表支持分页与关键词模糊搜索（名称 / 位置），
  管理员可新增、编辑、删除实验室，并可设置容量、开放时段、封面图与开放状态；
  创建与重命名时校验名称唯一性（更新时排除自身）
- **菜单权限**：侧边栏「实验室管理」「设备列表管理」「用户管理」仅对 `admin` 显示，
  「实验室列表」仅对学生显示
- **设备管理**：设备列表支持分页、关键词模糊搜索（名称 / 型号）与按实验室筛选，
  管理员可新增、编辑、删除设备；设备通过外键关联所属实验室，
  列表返回时带出 `lab_name`（用 `joinedload` 预加载，避免 N+1 查询）
- **学生端实验室列表**：学生登录后可查看实验室列表（只读，不可编辑）
- **预约申请**：`POST /api/reservation`，创建预约前做多重校验 ——
  日期不早于今天、结束时间晚于开始时间、当天预约不早于当前时刻、
  实验室存在且处于开放状态、预约时段落在实验室开放时段内、设备存在且非维修状态；
  并用**区间重叠算法**（`start < 目标结束 AND end > 目标开始`）检测同一实验室 /
  同一设备在同一日期的时段冲突，避免重复预约
- **预约记录查询**：`GET /api/reservation/list`，支持分页与按状态筛选；
  **学生只能看到自己的预约，管理员可见全部**；返回时补全 `user_name`、
  `lab_name`、`equipment_name` 与预约类型（实验室 / 设备）
- **取消预约**：`PUT /api/reservation/{id}/cancel`，校验记录归属（只能取消自己的）
  与状态（仅「待审核」可取消），取消后状态置为「已取消」
- **预约审核**：`PUT /api/reservation/{id}/audit`（管理员），
  仅「待审核」记录可审核为「已通过」或「已拒绝」，校验状态合法性
- **AI 智能助手**：`POST /api/ai/chat/stream`（SSE 流式），基于 LangChain 的
  `ChatOpenAI` 对接兼容 OpenAI 接口的大模型服务；用 System Prompt 约束模型
  只回答系统相关问题、不编造数据；前端用 `marked` 渲染 Markdown、
  `DOMPurify` 过滤 HTML 防 XSS
- **流式对话**：后端用 `StreamingResponse` 推送 SSE 事件
  （`status` / `tool_start` / `tool_end` / `token` / `done` / `error`），
  对话过程中实时展示工具调用进度与逐字输出；因 `EventSource` 无法携带 JWT，
  前端改用 `fetch` + `ReadableStream` 手动解析，并处理 TCP 分片（buffer 缓存）
  与 `content-type` 校验
- **RAG 知识库检索**：把 `backend/data/kb/*.md` 中的实验室规则文档入库，
  用 `chromadb` 持久化向量 + `BAAI/bge-small-zh-v1.5` 中文 embedding；
  检索时带相似度阈值过滤与排序，结果作为工具返回值供模型引用
- **LangGraph Agent（ReAct 工作流）**：用 `StateGraph` 编排
  `agent → tools_condition → tools → agent` 的循环，`ToolNode` 自动执行工具，
  `recursion_limit=10` 防止死循环，`temperature=0` 保证工具调用稳定
- **Agent 工具集**：`@tool` 定义 `search_lab_docs`（RAG 检索）、`list_open_labs`、
  `list_lab_equipments`、`create_lab_reservation`、`get_today`；
  工具内部异常以 JSON 回传模型，使其能自行修正参数后重试
- **写操作二次确认**：SYSTEM_PROMPT 强制要求「创建预约前必须复述实验室 / 设备、
  日期与时段并获得用户明确确认」，避免 Agent 擅自落库

### 开发中

- 预约时段可视化（日历 / 时间段选择器）
- 预约到期提醒
- AI 助手支持查询预约状态、并在用户确认后代发预约
- 接口单元测试

## 技术栈

| 层次 | 技术 |
|---|---|
| 前端 | Vue 3、Vite、Vue Router、Element Plus、Axios |
| 后端 | FastAPI、SQLAlchemy 2.0、Pydantic v2、Uvicorn |
| 认证 | PyJWT（JWT 签发与校验）、bcrypt（密码哈希） |
| AI · Agent | **LangGraph**（StateGraph / ToolNode / ReAct 工作流）、LangChain Core（`@tool` 工具定义）、LangChain OpenAI（ChatOpenAI） |
| AI · 检索 | chromadb（向量库）、sentence-transformers（bge-small-zh-v1.5 中文 embedding） |
| AI · 前端 | marked（Markdown 渲染）、DOMPurify（XSS 过滤） |
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
│   │   │   ├── user.py             # 用户信息与用户管理接口
│   │   │   ├── lab.py              # 实验室管理接口
│   │   │   ├── equipment.py        # 设备管理接口
│   │   │   ├── reservation.py      # 预约接口
│   │   │   ├── ai.py               # AI 对话接口
│   │   │   └── files.py            # 文件上传接口
│   │   ├── services/               # 业务逻辑层
│   │   │   ├── auth_service.py     # 登录 / 注册业务处理
│   │   │   ├── user_service.py     # 用户信息与用户管理业务处理
│   │   │   ├── lab_service.py      # 实验室业务处理
│   │   │   ├── equipment_service.py # 设备业务处理
│   │   │   ├── reservation_service.py # 预约业务处理（时段冲突检测）
│   │   │   ├── agent_service.py    # LangGraph Agent（StateGraph + ReAct 工作流）
│   │   │   ├── agent_tools.py      # Agent 工具定义（@tool：查实验室/设备、RAG 检索、创建预约）
│   │   │   ├── ai_service.py       # 旧版手写 Tool Calling 循环（保留供方案对比）
│   │   │   └── kb_service.py       # 知识库检索（RAG：chromadb + 中文 embedding）
│   │   ├── dependencies/           # 依赖注入
│   │   │   └── auth.py             # get_current_user：从 token 解析当前用户
│   │   ├── models/                 # ORM 模型（对应数据库表）
│   │   │   ├── user.py             # 用户表
│   │   │   ├── lab.py              # 实验室表
│   │   │   ├── equipment.py        # 设备表（外键关联实验室）
│   │   │   └── reservation.py      # 预约表（关联用户 / 实验室 / 设备）
│   │   ├── common/                 # 公共组件
│   │   │   ├── response.py         # 统一响应封装 Response
│   │   │   └── exceptions.py       # 自定义业务异常与全局异常处理器
│   │   ├── schemas/                # 请求 / 响应数据结构
│   │   │   ├── auth.py             # LoginRequest / RegisterRequest / LoginResponse
│   │   │   ├── user.py             # UserResponse / 创建与更新请求
│   │   │   ├── lab.py              # LabResponse / 创建与更新请求
│   │   │   ├── equipment.py        # EquipmentResponse / 创建与更新请求
│   │   │   ├── reservation.py      # ReservationResponse / 创建请求
│   │   │   └── ai.py               # ChatMessage / ChatRequest
│   │   ├── utils/                  # 通用工具
│   │   │   ├── jwt.py              # token 签发与解析
│   │   │   └── password.py         # 密码哈希与校验
│   │   ├── config.py               # 配置加载（读取 .env）
│   │   ├── database.py             # 数据库连接与会话管理
│   │   └── main.py                 # 应用入口
│   ├── data/
│   │   ├── kb/                     # 知识库文档（Markdown 语料，提交）
│   │   └── chroma/                 # 向量库持久化（运行时生成，不提交）
│   ├── requirements.txt            # Python 依赖
│   ├── uploads/                    # 用户上传的文件（运行时生成，不提交）
│   └── .env.example                # 环境变量模板
│
└── frontend/                       # 前端应用
    ├── src/
    │   ├── assets/                 # 静态资源（样式、图片）
    │   ├── components/             # 公共组件
    │   │   └── ReserveDialog.vue   # 预约弹窗（实验室 / 设备通用）
    │   ├── layouts/                # 布局组件
    │   │   └── Layout.vue          # 管理端整体框架
    │   ├── views/                  # 页面组件
    │   │   ├── Login.vue
    │   │   ├── Register.vue
    │   │   ├── Home.vue
    │   │   ├── Lab.vue
    │   │   ├── Profile.vue         # 个人中心（资料查看与修改）
    │   │   ├── Password.vue        # 修改密码
    │   │   ├── User.vue            # 用户管理（分页查询与增删改）
    │   │   ├── Equipment.vue       # 设备管理（分页查询与增删改）
    │   │   ├── LabList.vue         # 学生端实验室列表
    │   │   ├── LabEquipment.vue    # 实验室设备查看
    │   │   ├── MyReservation.vue   # 我的预约（列表 / 状态筛选 / 取消）
    │   │   ├── AuditReservation.vue # 预约审核（管理员）
    │   │   └── AIChat.vue          # AI 智能助手（Markdown 渲染 + XSS 过滤）
    │   ├── api/                    # 接口定义
    │   │   ├── auth.js             # 登录 / 注册接口
    │   │   ├── user.js             # 用户信息与用户管理接口
    │   │   ├── lab.js              # 实验室接口
    │   │   ├── equipment.js        # 设备接口
    │   │   ├── reservation.js      # 预约接口
    │   │   ├── ai.js               # AI 对话接口
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

# 配置环境变量：复制模板并填写数据库、JWT 与大模型配置
copy .env.example .env

# 启动服务
uvicorn app.main:app --reload
```

> **⚠️ `.env` 必须包含以下配置项**，否则后端启动会报 `ValidationError: Field required`：
>
> | 配置项 | 说明 |
> |---|---|
> | `DATABASE_URL` | MySQL 连接串 |
> | `JWT_SECRET_KEY` | 随机密钥，用 `python -c "import secrets; print(secrets.token_urlsafe(32))"` 生成 |
> | `LLM_API_KEY` | 大模型 API 密钥（AI 助手功能必需） |
> | `LLM_BASE_URL` | 大模型接口地址，如 `https://api.deepseek.com` |
> | `LLM_MODEL` | 模型名称，如 `deepseek-chat` |
>
> 完整示例见 [backend/.env.example](backend/.env.example)。**不要提交真实的 `.env`**。

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
| GET | `/api/user/list` | 用户列表（分页 + 关键词搜索） | **是（管理员）** |
| POST | `/api/user` | 新增用户 | **是（管理员）** |
| PUT | `/api/user/{user_id}` | 更新指定用户 | **是（管理员）** |
| DELETE | `/api/user/{user_id}` | 删除指定用户 | **是（管理员）** |
| GET | `/api/lab/list` | 实验室列表（分页 + 关键词搜索） | **是（管理员）** |
| POST | `/api/lab` | 新增实验室 | **是（管理员）** |
| PUT | `/api/lab/{lab_id}` | 更新指定实验室 | **是（管理员）** |
| DELETE | `/api/lab/{lab_id}` | 删除指定实验室 | **是（管理员）** |
| GET | `/api/equipment/list` | 设备列表（分页 + 关键词 + 实验室筛选） | **是（管理员）** |
| POST | `/api/equipment` | 新增设备 | **是（管理员）** |
| PUT | `/api/equipment/{equipment_id}` | 更新指定设备 | **是（管理员）** |
| DELETE | `/api/equipment/{equipment_id}` | 删除指定设备 | **是（管理员）** |
| POST | `/api/reservation` | 创建预约（含时段冲突检测） | **是** |
| GET | `/api/reservation/list` | 预约列表（学生看自己，管理员看全部） | **是** |
| PUT | `/api/reservation/{reservation_id}/cancel` | 取消预约 | **是** |
| PUT | `/api/reservation/{reservation_id}/audit` | 审核预约（通过 / 拒绝） | **是（管理员）** |
| POST | `/api/ai/chat/stream` | AI 对话（SSE 流式） | **是** |
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

### 后端 / 安全

- [ ] `users.username` 增加唯一约束，避免出现同名账号
- [ ] `verify_password` 增加异常兜底，兼容非 bcrypt 格式的历史数据
- [ ] `get_current_user` 在用户不存在时返回 401 而非抛 500
- [ ] 登录失败返回 HTTP 401/403 状态码，而非 `200 + code:400`
- [ ] 密码长度校验（bcrypt 仅处理前 72 字节，超出会报错）

### AI / Agent

- [ ] Agent 会话持久化（LangGraph checkpointer），支持上下文跨请求保留
- [ ] 补充 Agent 工具的单元测试（工具参数解析、异常回传）
- [ ] 清理旧版 `ai_service.py`（现由 LangGraph 实现替代，保留供方案对比）

### 通用

- [ ] 补充接口单元测试
- [ ] 引入 Alembic 管理数据库迁移（当前依赖 `create_all`，改结构需手动 drop）

## License

仅供学习交流使用。
