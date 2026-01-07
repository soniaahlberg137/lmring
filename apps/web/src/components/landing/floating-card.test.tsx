import { FloatingCard } from '@lmring/ui';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

/**
 * FloatingCard Component Tests
 *
 * Usage Examples:
 *
 * Basic usage:
 * ```tsx
 * <FloatingCard
 *   name="GPT-4"
 *   description="OpenAI"
 *   delay={1}
 * />
 * ```
 *
 * With custom icon:
 * ```tsx
 * import { ProviderIcon } from '@/components/arena/provider-icon';
 *
 * <FloatingCard
 *   name="Claude 4.5"
 *   description="Anthropic"
 *   icon={<ProviderIcon providerId="anthropic" size={32} type="avatar" />}
 *   delay={1.5}
 *   className="right-[8%] top-[25%] hidden lg:block"
 * />
 * ```
 *
 * Multiple cards in hero section:
 * ```tsx
 * <>
 *   <FloatingCard
 *     name="GPT-5.2"
 *     description="OpenAI"
 *     icon={<ProviderIcon providerId="openai" size={32} type="avatar" />}
 *     delay={1}
 *     className="left-[5%] top-[20%] hidden lg:block"
 *   />
 *   <FloatingCard
 *     name="Claude 4.5"
 *     description="Anthropic"
 *     icon={<ProviderIcon providerId="anthropic" size={32} type="avatar" />}
 *     delay={1.5}
 *     className="right-[8%] top-[25%] hidden lg:block"
 *   />
 *   <FloatingCard
 *     name="Gemini 3 Pro"
 *     description="Google"
 *     icon={<ProviderIcon providerId="google" size={32} type="avatar" />}
 *     delay={2}
 *     className="left-[10%] bottom-[30%] hidden lg:block"
 *   />
 * </>
 * ```
 */
describe('FloatingCard', () => {
  it('should render name and description', () => {
    render(<FloatingCard name="GPT-4" description="OpenAI" />);

    expect(screen.getByText('GPT-4')).toBeInTheDocument();
    expect(screen.getByText('OpenAI')).toBeInTheDocument();
  });

  it('should render without description', () => {
    render(<FloatingCard name="Claude" />);

    expect(screen.getByText('Claude')).toBeInTheDocument();
  });

  it('should render with custom icon', () => {
    render(
      <FloatingCard
        name="Gemini"
        description="Google"
        icon={<span data-testid="custom-icon">🤖</span>}
      />,
    );

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    expect(screen.getByText('Gemini')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <FloatingCard name="Test" className="custom-class left-[5%] top-[20%]" />,
    );

    const card = container.firstChild;
    expect(card).toHaveClass('custom-class');
  });
});
