# 🌟 紫微斗数在线排盘

<p align="center">
  <strong>一款现代化的紫微斗数排盘与 AI 智能解读应用</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite" alt="Vite 7" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" alt="TypeScript 5" />
</p>

---

## ✨ 功能特性

- 🎯 **精准排盘** - 根据出生信息生成紫微斗数命盘
- 🤖 **AI 解读** - 集成 OpenAI 兼容接口，智能解析命盘含义
- 💾 **命盘管理** - 支持保存、加载与导出命盘
- 🖼️ **图片导出** - 一键下载命盘为高清图片
- 🔍 **全屏查看** - 沉浸式查看命盘详情
- ⚙️ **个性化设置** - 可隐藏流曜、运限、出生时辰等
- 🌙 **深色模式** - 支持明暗主题切换
- 📱 **响应式设计** - 适配桌面端与移动端

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 构建工具 | Vite 7 |
| 样式方案 | Tailwind CSS 4 |
| 命盘核心 | [react-iztro](https://github.com/sylarlong/react-iztro) |
| 图表导出 | html2canvas |
| 后端服务 | Express.js |
| 部署平台 | Vercel |

## 📦 快速开始

### 环境要求

- **Node.js** 18+（`server.js` 依赖内置 `fetch`）
- **npm** 或 **pnpm**

### 安装依赖

```bash
npm install
```

### 配置环境变量

在项目根目录创建 `.env` 文件：

```env
# OpenAI 兼容接口配置
OPENAI_BASE_URL=https://your-openai-compatible-endpoint
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-4o-mini

# 服务端口（可选，默认 3088）
PORT=3088
```

### 启动开发服务

```bash
npm run dev
```

## 📜 可用脚本

| 命令 | 描述 |
|------|------|
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览生产构建 |
| `npm run lint` | 运行 ESLint 代码检查 |
| `npm run server` | 启动 Express 服务（含 API 代理） |
| `npm run start` | 构建并启动生产服务 |

## 🚀 生产部署

### 本地 / VPS 部署

```bash
# 构建生产版本
npm run build

# 启动服务
npm run server
```

服务将：
- 提供 `dist/` 目录下的静态资源
- 代理 `/api/interpret` 请求至 AI 接口

### Vercel 部署

项目已配置 `vercel.json`，支持一键部署至 Vercel 平台。

## 📁 项目结构

```
zwds/
├── src/
│   ├── components/       # React 组件
│   │   ├── Chart.tsx           # 命盘组件
│   │   ├── InputForm.tsx       # 输入表单
│   │   ├── AIInterpret.tsx     # AI 解读组件
│   │   ├── ChartToolbar.tsx    # 工具栏
│   │   ├── SettingsModal.tsx   # 设置弹窗
│   │   └── ...
│   ├── App.tsx           # 应用入口
│   └── index.css         # 全局样式
├── api/                  # Vercel Serverless Functions
├── server.js             # Express 本地服务
├── vercel.json           # Vercel 部署配置
└── package.json
```

## 🔧 类型检查

```bash
npx tsc -p tsconfig.json --noEmit
```

## 📄 许可证

MIT License

---

<p align="center">
  Made with ❤️ for 紫微斗数爱好者
</p>
