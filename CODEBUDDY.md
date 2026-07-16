# CODEBUDDY.md This file provides guidance to CodeBuddy when working with code in this repository.

## 项目概述

智能中台自动建模平台——一个微服务架构的机器学习建模系统。此仓库根目录仅包含**前端代码**（`vitePlus-vitePlus/`）和 **PostgreSQL 初始化脚本**（`postgres/init/`）。后端微服务（SpringBoot + FastAPI + Python）位于独立仓库 `model-backend/`，本机未检出。

## 常用命令

所有前端命令需在 `vitePlus-vitePlus/` 目录下执行：

```bash
cd vitePlus-vitePlus
npm run dev          # 启动开发服务器，端口 9877
npm run build        # 生产构建，输出到 dist/，会自动生成精细分包的 chunk
npm run preview      # 预览生产构建
npm run type-check   # TypeScript 类型检查（vue-tsc --noEmit）
```

开发时若无需与后端联调，在 `.env.development` 中设置 `VITE_SKIP_AUTH=true` 可跳过路由守卫的 Token 校验，直接预览前端页面。

## 技术栈

Vue 3（组合式 API）+ TypeScript + Vite 6 + Pinia + Element Plus 2 + ECharts 5 + axios

## 架构概览

### 三层后端代理

前端通过 Vite 开发代理（或生产环境 Nginx 代理）访问三个独立的后端服务，对应 `src/api/http.ts` 中三个 Axios 实例：

| 实例 | 代理前缀 | 后端目标 | 用途 |
|------|---------|------|------|
| `spring` | `/api` | SpringBoot Gateway:8080 | 认证、数据集、模型、任务、知识图谱等核心 CRUD |
| `algo` | `/api/algo` | FastAPI 主节点:8090 | 建模任务调度、文件分片上传、镜像构建 |
| `pyanalysis` | `/pyanalysis` | Python Data Service:8086 | 数据分析、异常值检测 |

**Gateway 微服务架构**：SpringBoot Gateway（:8080）作为统一入口，通过 Nacos 做服务发现，将请求路由到后端 5 个微服务：

| 微服务 | 端口 | 职责 |
|--------|------|------|
| auth-service | 8081 | 用户认证与权限 |
| data-service | 8082 | 数据集管理 |
| model-service | 8083 | 模型与镜像仓库 |
| task-service | 8084 | 任务调度与在线服务 |
| graph-service | 8085 | 知识图谱 |

FastAPI 主节点（:8090）负责建模任务的调度中心，通过 RabbitMQ 与副节点通信，动态调度 Docker 容器在副节点上执行训练/预测/数据预处理任务。副节点需**先于**主节点启动，否则任务会永久停留在"等待"状态。

### 请求认证与 Token 机制

`src/utils/request.ts` 中的 Axios 拦截器自动处理 Token 注入，关键细节：

- **双键容错**：从 localStorage 读取 `Token` 和 `token` 两个键任一个存在即可
- **大小写区分**：`/api/algo/**` 路径使用小写 `token` header（FastAPI 要求），其余路径使用大写 `Token` header（SpringBoot 要求）
- **鉴权失败处理**：响应码 `10010/10011/401/40100/40101` 时自动清除 token 并跳转 `/login`
- **免 token 路径**：`/auth/UserLogin/` 前缀的接口不拦截 token
- **后端返回统一格式**：`Result<T>` 结构（`{ code: string, data: T, msg: string }`），`code === '0'` 表示成功

### 路由认证守卫（`src/router/index.ts`）

- 支持 URL 嵌入式登录：URL 参数中携带 `username` 和 `password` 时自动调用登录接口
- `VITE_SKIP_AUTH=true` 可跳过认证（`.env.development` 中配置）
- `/login` 和 `/register` 路径直接放行，不走认证
- 网络错误时容错放行，由具体页面请求失败再处理

### 前端项目结构

```
src/
├── api/              # API 层
│   ├── http.ts       # 三个 Axios 实例工厂 + 强类型请求辅助函数
│   ├── auth.ts       # 认证接口 (login/register/checkLogin/logout)
│   ├── algo.ts       # FastAPI 算法服务接口
│   ├── data.ts       # 数据集管理接口
│   ├── task.ts       # 任务与在线服务接口
│   ├── model.ts      # 模型仓库与镜像仓库接口
│   ├── graph.ts      # 知识图谱接口
│   ├── pyanalysis.ts # Python 数据分析接口
│   └── types/        # TypeScript 接口/类型定义，按模块拆分，index.ts 统一导出
├── router/index.ts   # Vue Router 配置 + 认证守卫
├── store/index.ts    # Pinia Store（useMainStore: 模型列表 + token 内存缓存）
├── utils/
│   ├── request.ts    # Axios 实例与拦截器
│   └── token.ts      # Token 存取工具
├── views/            # 业务页面，按模块分目录
│   ├── AutoModel/    # 自动建模（TaskCreate/TaskModify 单文件超 130KB）
│   ├── DatasetManagement/  # 数据集管理
│   ├── DataAnnotation/     # 数据标注
│   ├── Graph/              # 知识图谱
│   ├── ModelRepository/    # 模型仓库
│   ├── ImageRepository/    # 镜像仓库
│   └── OnlineService/      # 在线服务部署与监控
├── components/       # 共享组件（Header/MenuLeft/MyChart/DistributeMathBar）
├── layout/Layout.vue # 主布局壳（Header + 左侧菜单 + router-view）
├── enums/            # 枚举常量
└── assets/css/global.css  # 全局 CSS，覆盖 Element Plus 主题变量
```

### 样式主题

已全面切换为红色系：Element Plus 主色通过 `:root` CSS 变量覆盖为 `#d32f2f`，输入框聚焦色为 `#F0D909`（金黄色）。各业务页面中硬编码的蓝色色值（`#1a2942`、`#4c75a3`）已替换为红色系对应值。后续修改样式需保持红色系一致性。

### Vite 构建配置要点

- 端口 9877，路径别名 `@` → `./src`
- `manualChunks` 精细分包策略：将 Vue 核心、Element Plus、ECharts、工具库、各业务模块分别独立打包
- 使用 `@vitejs/plugin-legacy` 支持旧浏览器兼容
- SVG 图标使用 `vite-plugin-svg-icons`，图标文件在 `src/assets/icons/`
- 全局注入 CSS 变量覆盖文件（`global.css`）

### 环境变量

| 变量 | 含义 | 配置文件 |
|------|------|----------|
| `VITE_API_TARGET` | Gateway 地址 | `.env.development` / `.env.production` |
| `VITE_PYANALYSIS_TARGET` | Python 数据分析服务 | 同上 |
| `VITE_BEFORE_TARGET` | FastAPI 算法服务 | 同上 |
| `VITE_SKIP_AUTH` | 跳过认证（仅开发） | `.env.development` |

**重要**：生产环境中 `VITE_API_TARGET` 必须指向 **Gateway:8080**，不能指向 auth-service:8081，否则会出现 Token 传递异常。

### PostgreSQL 数据库架构

`postgres/init/` 包含 7 个 SQL 脚本，由 Docker 容器启动时自动按序执行。采用**"数据库即服务边界"**的设计模式，每个微服务拥有独立数据库：

| 数据库 | 脚本 | 主要表 |
|--------|------|--------|
| `postgres`（默认） | `01-postgres.sql` | `node_list`（节点列表），`container_resource*`、`node_resource*`（按时间分区的资源监控表，含大量历史分区子表） |
| `auth_db` | `02-auth_db.sql` | `users`（用户表） |
| `data_db` | `03-data_db.sql` | `data_set` → `data_table` → `data_columns`（数据集三层结构），`tag_data_statistics`，`named_entity_statistics` |
| `model_db` | `04-model_db.sql` | `model_repository`，`image_repository` → `image_version_repository` |
| `task_db` | `05-task_db.sql` | `task` → `task_state` → `train_result`（任务生命周期），`online_service` → `online_service_log` |
| `graph_db` | `06-graph_db.sql` | `graph` → `node`、`relation`（知识图谱） |
| `user_data` | `00-create-databases.sql` | 仅创建 `upload_data` schema，用户上传数据表在运行时动态创建 |

**通用设计约定**：
- 所有业务表使用**软删除**模式（`is_delete` + `delete_time` 字段）
- 通过 `user_id` 字段实现多租户数据隔离
- 注意：`graph_db` 使用**驼峰命名**（如 `createTime`），与其他数据库的蛇形命名（`create_time`）不同
- `task_db` 中 `task_state` 表有触发器 `ctc`，在 `end_time` 更新时自动计算 `time_consuming`
