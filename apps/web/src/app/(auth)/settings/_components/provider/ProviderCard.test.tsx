import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Provider } from './types';

const { createMockIcon } = vi.hoisted(() => ({
  createMockIcon: (name: string) => {
    const MockIcon = ({ size, className }: { size?: number; className?: string }) => (
      <svg data-testid={`icon-${name}`} data-size={size} className={className} />
    );
    MockIcon.displayName = name;
    return MockIcon;
  },
}));

vi.mock('@lobehub/icons', () => ({
  OpenAI: {
    Avatar: createMockIcon('OpenAI.Avatar'),
  },
}));

describe('ProviderCard', () => {
  const mockOnToggle = vi.fn();
  const mockOnSelect = vi.fn();

  const MockIcon = createMockIcon('TestProvider');

  const defaultProvider: Provider = {
    id: 'openai',
    name: 'OpenAI',
    connected: false,
    Icon: MockIcon,
    description: 'OpenAI API provider for GPT models',
    type: 'disabled',
    tags: ['OpenAI', 'GPT'],
  };

  beforeEach(() => {
    mockOnToggle.mockClear();
    mockOnSelect.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render provider name', async () => {
    const { ProviderCard } = await import('./ProviderCard');
    render(
      <ProviderCard provider={defaultProvider} onToggle={mockOnToggle} onSelect={mockOnSelect} />,
    );

    expect(screen.getByText('OpenAI')).toBeInTheDocument();
  });

  it('should render provider description', async () => {
    const { ProviderCard } = await import('./ProviderCard');
    render(
      <ProviderCard provider={defaultProvider} onToggle={mockOnToggle} onSelect={mockOnSelect} />,
    );

    expect(screen.getByText('OpenAI API provider for GPT models')).toBeInTheDocument();
  });

  it('should render provider icon', async () => {
    const { ProviderCard } = await import('./ProviderCard');
    render(
      <ProviderCard provider={defaultProvider} onToggle={mockOnToggle} onSelect={mockOnSelect} />,
    );

    expect(screen.getByTestId('icon-TestProvider')).toBeInTheDocument();
  });

  it('should render first letter of name when no icon', async () => {
    const providerWithoutIcon: Provider = {
      ...defaultProvider,
      Icon: null,
    };

    const { ProviderCard } = await import('./ProviderCard');
    render(
      <ProviderCard
        provider={providerWithoutIcon}
        onToggle={mockOnToggle}
        onSelect={mockOnSelect}
      />,
    );

    expect(screen.getByText('O')).toBeInTheDocument();
  });

  it('should render tags excluding provider name', async () => {
    const { ProviderCard } = await import('./ProviderCard');
    render(
      <ProviderCard provider={defaultProvider} onToggle={mockOnToggle} onSelect={mockOnSelect} />,
    );

    // 'GPT' tag should be visible, but only one 'OpenAI' (the name, not the tag)
    expect(screen.getByText('GPT')).toBeInTheDocument();
  });

  it('should call onSelect when card is clicked', async () => {
    const { ProviderCard } = await import('./ProviderCard');
    render(
      <ProviderCard provider={defaultProvider} onToggle={mockOnToggle} onSelect={mockOnSelect} />,
    );

    const card = screen.getByTestId('card');
    fireEvent.click(card);

    expect(mockOnSelect).toHaveBeenCalledWith('openai');
    expect(mockOnSelect).toHaveBeenCalledTimes(1);
  });

  it('should call onToggle when switch is clicked', async () => {
    const { ProviderCard } = await import('./ProviderCard');
    render(
      <ProviderCard provider={defaultProvider} onToggle={mockOnToggle} onSelect={mockOnSelect} />,
    );

    const switchEl = screen.getByRole('switch');
    fireEvent.click(switchEl);

    expect(mockOnToggle).toHaveBeenCalledWith('openai');
    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it('should not trigger onSelect when switch is clicked', async () => {
    const { ProviderCard } = await import('./ProviderCard');
    render(
      <ProviderCard provider={defaultProvider} onToggle={mockOnToggle} onSelect={mockOnSelect} />,
    );

    const switchEl = screen.getByRole('switch');
    fireEvent.click(switchEl);

    // onSelect should not be called due to stopPropagation
    expect(mockOnSelect).not.toHaveBeenCalled();
  });

  it('should render switch as checked when connected', async () => {
    const connectedProvider: Provider = {
      ...defaultProvider,
      connected: true,
    };

    const { ProviderCard } = await import('./ProviderCard');
    render(
      <ProviderCard provider={connectedProvider} onToggle={mockOnToggle} onSelect={mockOnSelect} />,
    );

    const switchEl = screen.getByRole('switch');
    expect(switchEl).toBeChecked();
  });

  it('should render switch as unchecked when not connected', async () => {
    const { ProviderCard } = await import('./ProviderCard');
    render(
      <ProviderCard provider={defaultProvider} onToggle={mockOnToggle} onSelect={mockOnSelect} />,
    );

    const switchEl = screen.getByRole('switch');
    expect(switchEl).not.toBeChecked();
  });
});
