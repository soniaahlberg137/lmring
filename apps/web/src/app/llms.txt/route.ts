import { getBaseUrl } from '@/utils/BaseUrl';

export function GET() {
  const baseUrl = getBaseUrl();

  const content = `# LMRing

> LMRing is an open-source AI model comparison platform. Compare large language models side-by-side with real-time benchmarks, community-driven ELO rankings, and comprehensive analysis.

## About

LMRing helps developers, researchers, and AI enthusiasts evaluate and compare AI models through:
- **Side-by-side comparison**: Test multiple AI models with the same prompt and compare outputs in real-time
- **Benchmark leaderboard**: Rankings based on standardized benchmarks (GPQA, MMLU-Pro, LiveCodeBench, and more)
- **Community-driven ELO ratings**: TrueSkill-based ranking system powered by real user preferences
- **Multi-modal support**: Compare LLMs, image generation, video generation, text-to-speech, and more

## Docs

- [README](https://github.com/llm-ring/lmring/blob/main/README.md): Project overview and quick start guide
- [Contributing Guide](https://github.com/llm-ring/lmring/blob/main/CONTRIBUTING.md): How to contribute to LMRing
- [Security Policy](https://github.com/llm-ring/lmring/blob/main/SECURITY.md): Security guidelines

## Pages

- [Homepage](${baseUrl}/): Landing page with features overview
- [Leaderboard](${baseUrl}/leaderboard): AI model benchmark rankings and comparisons
- [How It Works](${baseUrl}/how-it-works): Step-by-step guide to using LMRing
- [Arena](${baseUrl}/arena): Side-by-side blind AI model comparison (requires sign-in)
- [Privacy Policy](${baseUrl}/privacy): How we handle your data
- [Terms of Service](${baseUrl}/terms): Usage terms and conditions

## Optional

- [Chinese Documentation](https://github.com/llm-ring/lmring/blob/main/docs/README.zh-CN.md): 中文文档
- [Code of Conduct](https://github.com/llm-ring/lmring/blob/main/CODE_OF_CONDUCT.md): Community standards
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
