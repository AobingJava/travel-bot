# Wander Travel Planner

移动端优先的旅行规划网站。用户输入目的地、时间和旅行主题后，AI 会生成三阶段 TODO，看板支持动态重排、旅伴邀请和动态通知。

## 主要能力

- 创建旅行：目的地、日期、主题 chip、人数，一键生成首版行程。
- TODO 看板：按行前 / 旅途 / 旅后三阶段展示任务，支持 AI 重新调整。
- 旅伴协作：邀请旅伴、展示确认状态、沉淀动态流。
- 邮箱登录：magic link 登录后可接受邀请和同步通知。

## 本地运行

1. 安装依赖：

```bash
pnpm install
```

2. 复制环境变量模板：

```bash
cp .env.example .env.local
```

3. 启动开发服务器：

```bash
pnpm dev
```

默认访问 `http://localhost:3000`。

## 环境变量

`LLM_BASE_URL` / `LLM_API_KEY` / `LLM_MODEL`
: OpenAI 兼容的大模型端点。未配置时，系统会自动回退到内置 demo 规划逻辑。

`CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_D1_DATABASE_ID` / `CLOUDFLARE_D1_API_TOKEN`
: 直接通过 Cloudflare D1 REST API 访问数据库。

`D1_PROXY_URL` / `D1_PROXY_TOKEN`
: 可选。优先使用 Cloudflare Worker 代理访问 D1，避免直接暴露管理型接口。

`SMTP_*`
: 邮件发送配置。未配置时会打印到服务端日志，便于本地调试 magic link。

## D1 初始化

项目附带 D1 schema 文件：

```bash
db/schema.sql
```

你可以用 Wrangler 在 Cloudflare 侧执行：

```bash
npx wrangler d1 execute <your-db-name> --file=db/schema.sql --remote
```

## Vercel 部署

- 项目已包含 `vercel.json`，会每 6 小时触发一次 `/api/cron/replan`。
- 生产环境需要在 Vercel 配置全部环境变量。
- `LLM_API_KEY` 不要直接写进仓库。你之前贴出的 key 已经暴露，应该先旋转成新值再使用。
