<div align="center">
  <h1><a href="https://www.lmring.com/">LMRING</a></h1>
  <p><strong>开源 LLM 对比竞技场</strong></p>
  <p>同时对比多个大语言模型，为响应投票，查看排行榜。</p>

  <a href="https://deepwiki.com/llm-ring/lmring"><img src="https://img.shields.io/badge/DeepWiki-llm--ring%2Flmring-blue.svg?logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAyCAYAAAAnWDnqAAAAAXNSR0IArs4c6QAAA05JREFUaEPtmUtyEzEQhtWTQyQLHNak2AB7ZnyXZMEjXMGeK/AIi+QuHrMnbChYY7MIh8g01fJoopFb0uhhEqqcbWTp06/uv1saEDv4O3n3dV60RfP947Mm9/SQc0ICFQgzfc4CYZoTPAswgSJCCUJUnAAoRHOAUOcATwbmVLWdGoH//PB8mnKqScAhsD0kYP3j/Yt5LPQe2KvcXmGvRHcDnpxfL2zOYJ1mFwrryWTz0advv1Ut4CJgf5uhDuDj5eUcAUoahrdY/56ebRWeraTjMt/00Sh3UDtjgHtQNHwcRGOC98BJEAEymycmYcWwOprTgcB6VZ5JK5TAJ+fXGLBm3FDAmn6oPPjR4rKCAoJCal2eAiQp2x0vxTPB3ALO2CRkwmDy5WohzBDwSEFKRwPbknEggCPB/imwrycgxX2NzoMCHhPkDwqYMr9tRcP5qNrMZHkVnOjRMWwLCcr8ohBVb1OMjxLwGCvjTikrsBOiA6fNyCrm8V1rP93iVPpwaE+gO0SsWmPiXB+jikdf6SizrT5qKasx5j8ABbHpFTx+vFXp9EnYQmLx02h1QTTrl6eDqxLnGjporxl3NL3agEvXdT0WmEost648sQOYAeJS9Q7bfUVoMGnjo4AZdUMQku50McDcMWcBPvr0SzbTAFDfvJqwLzgxwATnCgnp4wDl6Aa+Ax283gghmj+vj7feE2KBBRMW3FzOpLOADl0Isb5587h/U4gGvkt5v60Z1VLG8BhYjbzRwyQZemwAd6cCR5/XFWLYZRIMpX39AR0tjaGGiGzLVyhse5C9RKC6ai42ppWPKiBagOvaYk8lO7DajerabOZP46Lby5wKjw1HCRx7p9sVMOWGzb/vA1hwiWc6jm3MvQDTogQkiqIhJV0nBQBTU+3okKCFDy9WwferkHjtxib7t3xIUQtHxnIwtx4mpg26/HfwVNVDb4oI9RHmx5WGelRVlrtiw43zboCLaxv46AZeB3IlTkwouebTr1y2NjSpHz68WNFjHvupy3q8TFn3Hos2IAk4Ju5dCo8B3wP7VPr/FGaKiG+T+v+TQqIrOqMTL1VdWV1DdmcbO8KXBz6esmYWYKPwDL5b5FA1a0hwapHiom0r/cKaoqr+27/XcrS5UwSMbQAAAABJRU5ErkJggg==" alt="DeepWiki" /></a>
  <a href="https://discord.gg/JBbp362mv6"><img src="https://img.shields.io/badge/Discord-加入社区-5865F2?logo=discord&logoColor=white" alt="Discord" /></a>

  <a href="../LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue" alt="License" /></a>
  <a href="https://codecov.io/gh/llm-ring/lmring"><img src="https://codecov.io/gh/llm-ring/lmring/graph/badge.svg" alt="Codecov" /></a>
  <a href="https://github.com/llm-ring/lmring/stargazers"><img src="https://img.shields.io/github/stars/llm-ring/lmring" alt="GitHub Stars" /></a>
  <a href="https://github.com/llm-ring/lmring/pulls"><img src="https://img.shields.io/badge/PRs-欢迎贡献-brightgreen" alt="PRs Welcome" /></a>

  <img src="assets/homepage.gif" alt="LMRing Demo" width="800" />
</div>

<p align="center">
  <a href="../README.md">English</a> |
  <a href="README.zh-CN.md">简体中文</a>
</p>

## 功能特性

- **竞技场模式** — 同时对比 2-5 个 AI 模型，实时流式输出
- **排行榜** — 模型排名，支持表格、柱状图和散点图视图
- **投票系统** — 众包模型质量评估
- **对话历史** — 保存、分享和回顾你的对比记录
- **50+ 服务商** — OpenAI、Anthropic、Google、DeepSeek、Mistral 等
- **多模态** — 支持文本和图像输入（针对具有视觉能力的模型）
- **自托管** — 在自己的基础设施上完全掌控数据
- **多语言** — 支持英语、法语和中文

## 截图

| 竞技场 | 排行榜 |
|:-----:|:-----:|
| ![竞技场](assets/arena-main.png) | ![排行榜](assets/leaderboard-main.png) |

| 柱状图 | 散点图 | 设置 |
|:-----:|:-----:|:----:|
| ![柱状图](assets/bar-chart.png) | ![散点图](assets/scatter.png) | ![设置](assets/settings.png) |

## 快速开始

### 前置要求

- Node.js 24+
- pnpm 10+
- PostgreSQL 数据库

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/llm-ring/lmring.git
cd lmring

# 安装依赖
pnpm install

# 设置环境变量
cp .env.example .env

# 运行数据库迁移
pnpm db:migrate

# 启动开发服务器
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

### 自托管部署

LMRing 支持自托管部署，完全掌控你的数据。

**Docker Compose**（推荐）

```bash
docker compose up -d
```

**Vercel / Cloudflare**

部署到你喜欢的平台，按上述说明配置环境变量。

### 环境变量

| 变量 | 描述 | 必需 |
|------|------|------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | 是 |
| `BETTER_AUTH_SECRET` | 认证密钥（至少32字符） | 是 |
| `ENCRYPTION_KEY` | API 密钥加密密钥 | 是 |
| `GITHUB_CLIENT_ID` | GitHub OAuth 客户端 ID | 否 |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth 客户端密钥 | 否 |
| `GOOGLE_CLIENT_ID` | Google OAuth 客户端 ID | 否 |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 客户端密钥 | 否 |

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16, React 19, TypeScript |
| 样式 | Tailwind CSS 4, shadcn/ui |
| 状态管理 | Zustand |
| 数据库 | PostgreSQL, DrizzleORM |
| 认证 | Better-Auth |
| AI | Vercel AI SDK |
| 构建 | Turborepo, pnpm workspaces |

## 支持的服务商

OpenAI、Anthropic、Google、Azure、Amazon Bedrock、DeepSeek、Mistral、Groq、OpenRouter、X.ai、Together AI、Fireworks AI、Perplexity，以及任何兼容 OpenAI 的 API 端点。

## 参与贡献

欢迎贡献！请随时提交 Issue 和 Pull Request。

详情请参阅 [贡献指南](../CONTRIBUTING.md)。

## 许可证

[Apache 2.0](../LICENSE)
