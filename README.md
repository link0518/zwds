# ZWDS

紫微斗数排盘与 AI 解读应用。

## 功能
- 根据生日信息生成紫微斗数星盘
- 支持隐藏流曜/运限/出生时辰等显示项
- 星盘全屏查看
- 命盘保存、加载与导出
- 通过 `/api/interpret` 提供 AI 解读

## 技术栈
- React 19 + Vite
- Tailwind CSS
- react-iztro
- Express 代理服务

## 环境要求
- Node.js 18+（`server.js` 依赖内置 `fetch`）

## 快速开始
```bash
npm install
npm run dev
```

## 环境变量
在项目根目录创建 `.env`：
```bash
OPENAI_BASE_URL=https://your-openai-compatible-endpoint
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-4o-mini
PORT=3088
```

## 常用脚本
```bash
npm run dev        # 启动开发服务
npm run build      # 构建生产包
npm run preview    # 预览生产构建
npm run lint       # 运行 ESLint
npm run server     # 启动 Express 服务（含 /api/interpret 与静态资源）
npm run start      # 构建后启动服务
```

## 类型检查
```bash
npx tsc -p tsconfig.json --noEmit
```

## 生产部署
```bash
npm run build
npm run server
```

服务会提供 `dist/` 静态资源，并代理 `/api/interpret` 请求。
