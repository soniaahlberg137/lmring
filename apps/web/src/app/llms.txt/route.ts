import { NextResponse } from 'next/server';

export async function GET() {
  const content = generateLlmsTxt();

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

function generateLlmsTxt(): string {
  return `# LMRing

> Open-source LLM comparison arena. Compare multiple AI models side by side, vote on responses, and see the leaderboard.

LMRing is a web application that allows users to compare 2-5 AI models simultaneously with real-time streaming. It supports 50+ providers including OpenAI, Anthropic, Google, DeepSeek, and more.

Key features:
- Arena Mode for side-by-side model comparison
- Video generation comparison (OpenAI Sora, Google Vevo, MiniMax, Kling, Seedance, Vidu, etc.)
- Authentication via GitHub, Google, and Linux.do OAuth
- Email OTP verification via Resend
- Crowdsourced voting system and leaderboard
- Self-hosted deployment option with full data ownership
- Internationalization (English, French, Chinese)

Tech stack: Next.js 16, React 19, TypeScript, Tailwind CSS 4, PostgreSQL, DrizzleORM, Better-Auth, Resend, Vercel AI SDK

## Docs

- [README](https://github.com/llm-ring/lmring/blob/main/README.md): Project overview and quick start guide
- [Contributing Guide](https://github.com/llm-ring/lmring/blob/main/CONTRIBUTING.md): How to contribute to LMRing
- [Security Policy](https://github.com/llm-ring/lmring/blob/main/SECURITY.md): Security guidelines

## Pages

- [Homepage](https://www.lmring.com/): Landing page with features overview
- [How It Works](https://www.lmring.com/how-it-works): Step-by-step guide to using LMRing
- [Leaderboard](https://www.lmring.com/leaderboard): View model rankings

## Optional

- [Chinese Documentation](https://github.com/llm-ring/lmring/blob/main/docs/README.zh-CN.md): 中文文档
- [Code of Conduct](https://github.com/llm-ring/lmring/blob/main/CODE_OF_CONDUCT.md): Community standards
`;
}
