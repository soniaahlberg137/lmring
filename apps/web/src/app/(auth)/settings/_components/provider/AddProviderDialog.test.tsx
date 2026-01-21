import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { createMockIcon } = vi.hoisted(() => ({
  createMockIcon: (name: string) => {
    const MockIcon = ({ size, className }: { size?: number; className?: string }) => (
      <svg data-testid={`icon-${name}`} data-size={size} className={className} />
    );
    MockIcon.displayName = name;
    return MockIcon;
  },
}));

vi.mock('lucide-react', () => ({
  BoxIcon: createMockIcon('BoxIcon'),
  Loader2Icon: createMockIcon('Loader2Icon'),
  PlusIcon: createMockIcon('PlusIcon'),
}));

vi.mock('@/hooks/use-translations', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@lobehub/icons', () => ({
  Anthropic: createMockIcon('Anthropic'),
  Azure: createMockIcon('Azure'),
  Google: createMockIcon('Google'),
  OpenAI: createMockIcon('OpenAI'),
}));

vi.mock('@lmring/model-depot', () => ({
  PROVIDER_OPTIONS: ['OpenAI', 'Anthropic', 'Gemini', 'Azure OpenAI'],
  PROVIDER_TYPE_TO_DEPOT_ID: {
    OpenAI: 'openai',
    Anthropic: 'anthropic',
    Gemini: 'google',
    'Azure OpenAI': 'azure',
  },
}));

describe('AddProviderDialog', () => {
  const mockOnAdd = vi.fn();

  beforeEach(() => {
    mockOnAdd.mockClear();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'new-provider-id' }),
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('should render add provider button', async () => {
    const { AddProviderDialog } = await import('./AddProviderDialog');
    render(<AddProviderDialog onAdd={mockOnAdd} />);

    expect(screen.getByText('Provider.add_provider')).toBeInTheDocument();
  });

  it('should open dialog when button is clicked', async () => {
    const { AddProviderDialog } = await import('./AddProviderDialog');
    render(<AddProviderDialog onAdd={mockOnAdd} />);

    const addButton = screen.getByText('Provider.add_provider');
    fireEvent.click(addButton);

    expect(screen.getByText('Provider.add_provider_dialog_title')).toBeInTheDocument();
  });

  it('should render name input in dialog', async () => {
    const { AddProviderDialog } = await import('./AddProviderDialog');
    render(<AddProviderDialog onAdd={mockOnAdd} />);

    fireEvent.click(screen.getByText('Provider.add_provider'));

    expect(screen.getByLabelText('Provider.add_provider_dialog_provider_name')).toBeInTheDocument();
  });

  it('should render provider type select in dialog', async () => {
    const { AddProviderDialog } = await import('./AddProviderDialog');
    render(<AddProviderDialog onAdd={mockOnAdd} />);

    fireEvent.click(screen.getByText('Provider.add_provider'));

    expect(screen.getByLabelText('Provider.add_provider_dialog_provider_type')).toBeInTheDocument();
  });

  it('should have disabled submit button when form is empty', async () => {
    const { AddProviderDialog } = await import('./AddProviderDialog');
    render(<AddProviderDialog onAdd={mockOnAdd} />);

    fireEvent.click(screen.getByText('Provider.add_provider'));

    const submitButton = screen.getByText('Provider.add_provider_dialog_ok');
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when form is filled', async () => {
    const { AddProviderDialog } = await import('./AddProviderDialog');
    render(<AddProviderDialog onAdd={mockOnAdd} />);

    fireEvent.click(screen.getByText('Provider.add_provider'));

    const nameInput = screen.getByLabelText('Provider.add_provider_dialog_provider_name');
    fireEvent.change(nameInput, { target: { value: 'My Provider' } });

    // Select provider type
    const selectTrigger = screen.getByTestId('select-trigger');
    fireEvent.click(selectTrigger);

    const option = screen.getByRole('option', { name: 'OpenAI' });
    fireEvent.click(option);

    const submitButton = screen.getByText('Provider.add_provider_dialog_ok');
    expect(submitButton).not.toBeDisabled();
  });

  it('should call onAdd and close dialog when form is submitted', async () => {
    const { AddProviderDialog } = await import('./AddProviderDialog');
    render(<AddProviderDialog onAdd={mockOnAdd} />);

    fireEvent.click(screen.getByText('Provider.add_provider'));

    const nameInput = screen.getByLabelText('Provider.add_provider_dialog_provider_name');
    fireEvent.change(nameInput, { target: { value: 'My Provider' } });

    // Select provider type
    const selectTrigger = screen.getByTestId('select-trigger');
    fireEvent.click(selectTrigger);
    fireEvent.click(screen.getByRole('option', { name: 'OpenAI' }));

    const submitButton = screen.getByText('Provider.add_provider_dialog_ok');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnAdd).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.queryByText('Provider.add_provider_dialog_title')).not.toBeInTheDocument();
    });
  });

  it('should close dialog when cancel button is clicked', async () => {
    const { AddProviderDialog } = await import('./AddProviderDialog');
    render(<AddProviderDialog onAdd={mockOnAdd} />);

    fireEvent.click(screen.getByText('Provider.add_provider'));
    expect(screen.getByText('Provider.add_provider_dialog_title')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Provider.add_provider_dialog_cancel'));

    await waitFor(() => {
      expect(screen.queryByText('Provider.add_provider_dialog_title')).not.toBeInTheDocument();
    });
  });

  it('should show error message when API call fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Provider already exists' }),
    });

    const { AddProviderDialog } = await import('./AddProviderDialog');
    render(<AddProviderDialog onAdd={mockOnAdd} />);

    fireEvent.click(screen.getByText('Provider.add_provider'));

    const nameInput = screen.getByLabelText('Provider.add_provider_dialog_provider_name');
    fireEvent.change(nameInput, { target: { value: 'My Provider' } });

    const selectTrigger = screen.getByTestId('select-trigger');
    fireEvent.click(selectTrigger);
    fireEvent.click(screen.getByRole('option', { name: 'OpenAI' }));

    fireEvent.click(screen.getByText('Provider.add_provider_dialog_ok'));

    await waitFor(() => {
      expect(screen.getByText('Provider already exists')).toBeInTheDocument();
    });
  });

  it('should reset form when dialog is reopened', async () => {
    const { AddProviderDialog } = await import('./AddProviderDialog');
    render(<AddProviderDialog onAdd={mockOnAdd} />);

    // Open and fill form
    fireEvent.click(screen.getByText('Provider.add_provider'));
    const nameInput = screen.getByLabelText('Provider.add_provider_dialog_provider_name');
    fireEvent.change(nameInput, { target: { value: 'My Provider' } });

    // Close dialog
    fireEvent.click(screen.getByText('Provider.add_provider_dialog_cancel'));

    // Reopen dialog
    await waitFor(() => {
      fireEvent.click(screen.getByText('Provider.add_provider'));
    });

    const newNameInput = screen.getByLabelText('Provider.add_provider_dialog_provider_name');
    expect(newNameInput).toHaveValue('');
  });
});
