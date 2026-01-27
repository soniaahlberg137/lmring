import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const mockT = vi.fn((key: string) => key);

vi.mock('@/hooks/use-translations', () => ({
  useTranslations: () => mockT,
}));

vi.mock('@/components/arena/provider-icon', () => ({
  ProviderIcon: ({ providerId, size }: { providerId: string; size: number }) => (
    <div data-testid="provider-icon" data-provider-id={providerId} data-size={size}>
      Icon
    </div>
  ),
}));

vi.mock('@lmring/ui', () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
}));

vi.mock('lucide-react', () => ({
  X: () => <svg data-testid="x-icon" />,
}));

describe('ModelTab', () => {
  it('should render model name and provider icon when model is provided', async () => {
    const { ModelTab } = await import('./model-tab');
    const onClick = vi.fn();
    const model = {
      id: 'openai:gpt-4',
      name: 'GPT-4',
      provider: 'OpenAI',
      providerId: 'openai',
      description: 'GPT-4 from OpenAI',
    };

    render(<ModelTab model={model} onClick={onClick} />);

    expect(screen.getByTestId('provider-icon')).toBeInTheDocument();
    expect(screen.getByTestId('provider-icon')).toHaveAttribute('data-provider-id', 'openai');
    expect(screen.getByText('GPT-4')).toBeInTheDocument();
  });

  it('should render select model text when model is undefined', async () => {
    const { ModelTab } = await import('./model-tab');
    const onClick = vi.fn();

    render(<ModelTab model={undefined} onClick={onClick} />);

    expect(mockT).toHaveBeenCalledWith('Arena.select_model');
    expect(screen.getByText('Arena.select_model')).toBeInTheDocument();
  });

  it('should apply active styles when isActive is true', async () => {
    const { ModelTab } = await import('./model-tab');
    const onClick = vi.fn();
    const model = {
      id: 'openai:gpt-4',
      name: 'GPT-4',
      provider: 'OpenAI',
      providerId: 'openai',
      description: 'GPT-4 from OpenAI',
    };

    const { container } = render(<ModelTab model={model} onClick={onClick} isActive={true} />);

    const tabDiv = container.firstChild as HTMLElement;
    expect(tabDiv.className).toContain('bg-accent border-border');
  });

  it('should call onClick when button is clicked', async () => {
    const { ModelTab } = await import('./model-tab');
    const onClick = vi.fn();
    const model = {
      id: 'openai:gpt-4',
      name: 'GPT-4',
      provider: 'OpenAI',
      providerId: 'openai',
      description: 'GPT-4 from OpenAI',
    };

    render(<ModelTab model={model} onClick={onClick} />);

    const button = screen.getByRole('button', { name: /gpt-4/i });
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should call onRemove when remove button is clicked with stopPropagation', async () => {
    const { ModelTab } = await import('./model-tab');
    const onClick = vi.fn();
    const onRemove = vi.fn();
    const model = {
      id: 'openai:gpt-4',
      name: 'GPT-4',
      provider: 'OpenAI',
      providerId: 'openai',
      description: 'GPT-4 from OpenAI',
    };

    render(<ModelTab model={model} onClick={onClick} onRemove={onRemove} />);

    const removeButton = screen.getByLabelText('Arena.remove_model');
    fireEvent.click(removeButton);

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('should hide remove button when canRemove is false', async () => {
    const { ModelTab } = await import('./model-tab');
    const onClick = vi.fn();
    const onRemove = vi.fn();
    const model = {
      id: 'openai:gpt-4',
      name: 'GPT-4',
      provider: 'OpenAI',
      providerId: 'openai',
      description: 'GPT-4 from OpenAI',
    };

    render(<ModelTab model={model} onClick={onClick} onRemove={onRemove} canRemove={false} />);

    expect(screen.queryByLabelText('Arena.remove_model')).not.toBeInTheDocument();
  });

  it('should hide remove button when onRemove is not provided', async () => {
    const { ModelTab } = await import('./model-tab');
    const onClick = vi.fn();
    const model = {
      id: 'openai:gpt-4',
      name: 'GPT-4',
      provider: 'OpenAI',
      providerId: 'openai',
      description: 'GPT-4 from OpenAI',
    };

    render(<ModelTab model={model} onClick={onClick} />);

    expect(screen.queryByLabelText('Arena.remove_model')).not.toBeInTheDocument();
  });
});
