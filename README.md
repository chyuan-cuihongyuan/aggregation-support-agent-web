# Aggregation Support Agent Web

## 项目概述

Aggregation Support Agent Web 是智能运维聚合平台的前端应用，对接 `aggregation-support-agent`（默认 8091），提供 RAG 智能问答对话、知识库管理、AIOps 告警分析与多会话管理能力。基于 Next.js 16 App Router + React 19 + TypeScript 构建，使用 Tailwind CSS 4、shadcn/ui 与 Radix UI 组件体系，支持流式（SSE）对话、文档上传、知识图谱可视化与多租户登录。

### 核心特性

- **流式对话**：基于 SSE 的实时对话，支持工具调用结果卡片、状态栏、消息导出（Markdown / PDF / DOCX）
- **知识库管理**：文档列表、文件上传、图片网格、知识图谱（react-force-graph-2d）、语义检索面板
- **AIOps 运维**：一键告警分析，Markdown 报告渲染（marked + DOMPurify 防 XSS）
- **多会话管理**：会话侧边栏、历史记录、会话切换与导出
- **用户体系**：登录/注册、用户管理、主题切换（next-themes 暗色模式）
- **插件机制**：插件状态栏与配置管理
- **安全防护**：DOMPurify XSS 过滤、鉴权拦截、性能监控（web-vitals）

## 使用功能

### 页面路由

| 路由 | 说明 |
|------|------|
| `/` | 首页 |
| `/login` | 登录 |
| `/register` | 注册 |
| `/chat` | 智能对话（流式 SSE） |
| `/knowledge` | 知识库管理（文档/图片/图谱/检索） |
| `/aiops` | AIOps 告警分析 |
| `/settings` | 设置 |
| `/admin/users` | 用户管理 |

### 关键组件

| 组件 | 说明 |
|------|------|
| `chat/chat-input` | 对话输入框 |
| `chat/message-list` / `message-bubble` | 消息列表与气泡 |
| `chat/tool-result-card` | 工具调用结果卡片 |
| `chat/chat-sidebar` / `chat-topbar` / `status-bar` | 对话布局 |
| `chat/export-actions` | 导出（Markdown/PDF/DOCX） |
| `knowledge/file-upload` / `document-list` | 文档上传与列表 |
| `knowledge/graph-viewer` | 知识图谱可视化 |
| `knowledge/search-panel` / `image-grid` | 检索面板与图片网格 |
| `session/session-manager` | 多会话管理 |
| `plugins/plugin-status-bar` | 插件状态 |

### Hooks

| Hook | 说明 |
|------|------|
| `use-chat` | 对话流式逻辑 |
| `use-session` | 会话管理 |
| `use-history` | 历史记录 |
| `use-auth` | 鉴权 |
| `use-plugin-config` / `use-plugin-status` | 插件配置与状态 |
| `use-alerts` | 告警 |

## 使用技术

| 技术 | 版本 | 说明 |
|------|------|------|
| Next.js | 16.2.6 | React 全栈框架（App Router） |
| React | 19.2.4 | UI 库 |
| TypeScript | 5.x | 类型系统 |
| Tailwind CSS | 4.x | 原子化样式 |
| shadcn/ui | 4.7.0 | 组件库 |
| Radix UI | - | 无障碍基础组件 |
| next-themes | 0.4.6 | 主题切换 |
| marked | 18.0.3 | Markdown 渲染 |
| DOMPurify | 3.4.5 | XSS 过滤 |
| html2canvas / jspdf | - | 导出 PDF |
| docx / file-saver | - | 导出 DOCX |
| react-force-graph-2d | 1.29.1 | 知识图谱 |
| sonner | 2.0.7 | 消息提示 |
| lucide-react | 1.14.0 | 图标 |
| date-fns | 4.1.0 | 日期处理 |
| Jest | 29.7.0 | 单元测试 |
| Playwright | 1.60.0 | E2E 测试 |

## 快速开始

### 环境要求

- Node.js 18+
- npm（或 pnpm / yarn）

### 启动步骤

1. **安装依赖**

```bash
npm install
```

2. **配置后端地址**

在 `src/lib/api.ts` 中确认后端地址指向 `aggregation-support-agent`（默认 `http://localhost:8091`），并配置鉴权信息。

3. **开发模式**

```bash
npm run dev
```

浏览器打开 `http://localhost:3000`。

4. **生产构建**

```bash
npm run build
npm run start
```

### 测试

```bash
npm run test         # 单元测试（Jest + Testing Library）
npm run test:e2e     # E2E 测试（Playwright）
npm run lint         # ESLint
```

## 项目结构

```
aggregation-support-agent-web/
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── chat/                  # 对话页（流式 SSE）
│   │   ├── knowledge/             # 知识库管理
│   │   ├── aiops/                 # AIOps 告警分析
│   │   ├── login/ / register/     # 登录注册
│   │   ├── settings/              # 设置
│   │   ├── admin/users/           # 用户管理
│   │   └── api/                   # 后端代理路由
│   ├── components/
│   │   ├── chat/                  # 对话相关组件
│   │   ├── knowledge/             # 知识库组件
│   │   ├── session/               # 会话管理
│   │   ├── plugins/               # 插件
│   │   ├── sidebar/ / topbar/     # 布局
│   │   ├── state/                 # 状态组件
│   │   └── ui/                    # shadcn/ui 基础组件
│   ├── hooks/                     # 业务 Hooks
│   ├── lib/                       # api / auth / security / performance
│   ├── types/                     # 类型定义
│   └── __tests__/                 # 单元测试
├── public/
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── jest.config.js
├── playwright.config.ts
└── package.json
```

## 在 Agent 体系中的位置

```
用户 → aggregation-support-agent-web (前端, 3000)   ← 本项目
     → aggregation-support-agent (RAG/AIOps 后端, 8091)
        → mcp-gateway-agent (MCP 网关, 8777)
           → agent-add-oil (加油业务, 8877)
              → 油站渠道 / 支付通道

agent-rag-observability-web (3000) ← 监控前端
agent-rag-observability-server (8092) ← 监控后端
```

本前端是用户与智能体交互的入口，对话/知识库/AIOps 请求经 `aggregation-support-agent` 处理，必要时经 MCP 网关调用业务系统。

## 许可证

Apache License, Version 2.0

## 联系方式

- 开发者：chyuan
- 邮箱：184172133@qq.com
