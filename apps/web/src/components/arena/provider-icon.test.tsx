import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProviderIcon } from './provider-icon';

vi.mock('@lobehub/icons', () => {
  const createMockIcon = (name: string) => {
    const MockIcon = ({ size, className }: { size?: number; className?: string }) => (
      <div data-testid={`icon-${name}`} data-size={size} className={className} />
    );
    MockIcon.Avatar = ({ size, className }: { size?: number; className?: string }) => (
      <div data-testid={`avatar-${name}`} data-size={size} className={className} />
    );
    MockIcon.Combine = ({ size, className }: { size?: number; className?: string }) => (
      <div data-testid={`combine-${name}`} data-size={size} className={className} />
    );
    return MockIcon;
  };

  return {
    OpenAI: createMockIcon('openai'),
    Anthropic: createMockIcon('anthropic'),
    Google: createMockIcon('google'),
    DeepSeek: createMockIcon('deepseek'),
    Mistral: createMockIcon('mistral'),
    Azure: createMockIcon('azure'),
    Groq: createMockIcon('groq'),
    Cohere: createMockIcon('cohere'),
    Together: createMockIcon('together'),
    Fireworks: createMockIcon('fireworks'),
    Meta: createMockIcon('meta'),
    Aws: createMockIcon('aws'),
    Nvidia: createMockIcon('nvidia'),
    HuggingFace: createMockIcon('huggingface'),
    Perplexity: createMockIcon('perplexity'),
    XAI: createMockIcon('xai'),
    OpenRouter: createMockIcon('openrouter'),
    SiliconCloud: createMockIcon('silicon'),
    AlibabaCloud: createMockIcon('dashscope'),
    Zhipu: createMockIcon('zhipu'),
    Moonshot: createMockIcon('moonshot'),
    Ollama: createMockIcon('ollama'),
    VertexAI: createMockIcon('vertex'),
    SambaNova: createMockIcon('sambanova'),
    Github: createMockIcon('github'),
    Cerebras: createMockIcon('cerebras'),
    Cloudflare: createMockIcon('cloudflare'),
    Nebius: createMockIcon('nebius'),
    Upstage: createMockIcon('upstage'),
    Novita: createMockIcon('novita'),
    Ai21: createMockIcon('ai21'),
    Baichuan: createMockIcon('baichuan'),
    Yi: createMockIcon('yi'),
    Minimax: createMockIcon('minimax'),
    Stepfun: createMockIcon('step'),
    Bfl: createMockIcon('bfl'),
    Infinigence: createMockIcon('infiniai'),
    Jina: createMockIcon('jina'),
    Search1API: createMockIcon('search1api'),
    Replicate: createMockIcon('replicate'),
    Hunyuan: createMockIcon('hunyuan'),
    Spark: createMockIcon('spark'),
    Volcengine: createMockIcon('volcengine'),
    Wenxin: createMockIcon('wenxin'),
    SenseNova: createMockIcon('sensenova'),
    InternLM: createMockIcon('internlm'),
    GiteeAI: createMockIcon('giteeai'),
    ModelScope: createMockIcon('modelscope'),
    Qiniu: createMockIcon('qiniu'),
    PPIO: createMockIcon('ppio'),
    TencentCloud: createMockIcon('tencentcloud'),
    LmStudio: createMockIcon('lmstudio'),
    Vllm: createMockIcon('vllm'),
    Xinference: createMockIcon('xinference'),
    Higress: createMockIcon('higress'),
    AiMass: createMockIcon('taichu'),
    ElevenLabs: createMockIcon('elevenlabs'),
    Luma: createMockIcon('luma'),
    Kling: createMockIcon('kling'),
    Recraft: createMockIcon('recraft'),
    XiaomiMiMo: createMockIcon('xiaomimimo'),
    Fal: createMockIcon('fal'),
  };
});

describe('ProviderIcon', () => {
  afterEach(() => {
    cleanup();
  });
  it('should render OpenAI icon', () => {
    render(<ProviderIcon providerId="openai" />);
    expect(screen.getByTestId('avatar-openai')).toBeInTheDocument();
  });

  it('should render Anthropic icon', () => {
    render(<ProviderIcon providerId="anthropic" />);
    expect(screen.getByTestId('avatar-anthropic')).toBeInTheDocument();
  });

  it('should render fallback emoji for unknown provider', () => {
    render(<ProviderIcon providerId="unknown-provider" />);
    expect(screen.getByText('🤖')).toBeInTheDocument();
  });

  it('should pass size prop correctly', () => {
    render(<ProviderIcon providerId="openai" size={24} />);
    const icon = screen.getByTestId('avatar-openai');
    expect(icon.getAttribute('data-size')).toBe('24');
  });

  it('should pass className prop correctly', () => {
    render(<ProviderIcon providerId="openai" className="custom-class" />);
    const icon = screen.getByTestId('avatar-openai');
    expect(icon.className).toBe('custom-class');
  });

  it('should render avatar type by default', () => {
    render(<ProviderIcon providerId="google" />);
    expect(screen.getByTestId('avatar-google')).toBeInTheDocument();
  });

  it('should render combine type when specified', () => {
    render(<ProviderIcon providerId="google" type="combine" />);
    expect(screen.getByTestId('combine-google')).toBeInTheDocument();
  });

  it('should render icon with default size', () => {
    render(<ProviderIcon providerId="openai" />);
    const icon = screen.getByTestId('avatar-openai');
    expect(icon.getAttribute('data-size')).toBe('16');
  });

  it('should handle case-insensitive provider IDs', () => {
    render(<ProviderIcon providerId="OpenAI" />);
    expect(screen.getByTestId('avatar-openai')).toBeInTheDocument();
  });

  it('should render deepseek icon', () => {
    render(<ProviderIcon providerId="deepseek" />);
    expect(screen.getByTestId('avatar-deepseek')).toBeInTheDocument();
  });

  it('should handle ZeroEval provider mappings', () => {
    render(<ProviderIcon providerId="fireworks" />);
    expect(screen.getByTestId('avatar-fireworks')).toBeInTheDocument();
  });

  it('should apply fontSize to fallback emoji', () => {
    const { container } = render(<ProviderIcon providerId="unknown" size={32} />);
    const emoji = container.querySelector('span');
    expect(emoji).toHaveStyle({ fontSize: '32px' });
  });
});
