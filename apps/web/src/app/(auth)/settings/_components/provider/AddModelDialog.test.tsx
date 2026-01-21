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
  PlusIcon: createMockIcon('PlusIcon'),
}));

vi.mock('@/hooks/use-translations', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('AddModelDialog', () => {
  const mockOnAdd = vi.fn();

  beforeEach(() => {
    mockOnAdd.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render add model button', async () => {
    const { AddModelDialog } = await import('./AddModelDialog');
    render(<AddModelDialog onAdd={mockOnAdd} />);

    expect(screen.getByTestId('icon-PlusIcon')).toBeInTheDocument();
  });

  it('should open dialog when button is clicked', async () => {
    const { AddModelDialog } = await import('./AddModelDialog');
    render(<AddModelDialog onAdd={mockOnAdd} />);

    const addButton = screen.getByRole('button');
    fireEvent.click(addButton);

    expect(screen.getByText('Provider.add_model_dialog_title')).toBeInTheDocument();
  });

  it('should render model ID input', async () => {
    const { AddModelDialog } = await import('./AddModelDialog');
    render(<AddModelDialog onAdd={mockOnAdd} />);

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByLabelText(/Provider.add_model_dialog_model_id/)).toBeInTheDocument();
  });

  it('should render model name input', async () => {
    const { AddModelDialog } = await import('./AddModelDialog');
    render(<AddModelDialog onAdd={mockOnAdd} />);

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByLabelText('Provider.add_model_dialog_model_name')).toBeInTheDocument();
  });

  it('should have disabled submit button when model ID is empty', async () => {
    const { AddModelDialog } = await import('./AddModelDialog');
    render(<AddModelDialog onAdd={mockOnAdd} />);

    fireEvent.click(screen.getByRole('button'));

    const submitButton = screen.getByText('Provider.add_model_dialog_ok');
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when model ID is filled', async () => {
    const { AddModelDialog } = await import('./AddModelDialog');
    render(<AddModelDialog onAdd={mockOnAdd} />);

    fireEvent.click(screen.getByRole('button'));

    const modelIdInput = screen.getByLabelText(/Provider.add_model_dialog_model_id/);
    fireEvent.change(modelIdInput, { target: { value: 'gpt-4-turbo' } });

    const submitButton = screen.getByText('Provider.add_model_dialog_ok');
    expect(submitButton).not.toBeDisabled();
  });

  it('should call onAdd with correct values when form is submitted', async () => {
    const { AddModelDialog } = await import('./AddModelDialog');
    render(<AddModelDialog onAdd={mockOnAdd} />);

    fireEvent.click(screen.getByRole('button'));

    const modelIdInput = screen.getByLabelText(/Provider.add_model_dialog_model_id/);
    const modelNameInput = screen.getByLabelText('Provider.add_model_dialog_model_name');

    fireEvent.change(modelIdInput, { target: { value: 'gpt-4-turbo' } });
    fireEvent.change(modelNameInput, { target: { value: 'GPT-4 Turbo' } });

    fireEvent.click(screen.getByText('Provider.add_model_dialog_ok'));

    expect(mockOnAdd).toHaveBeenCalledWith({
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
    });
  });

  it('should use model ID as name when name is empty', async () => {
    const { AddModelDialog } = await import('./AddModelDialog');
    render(<AddModelDialog onAdd={mockOnAdd} />);

    fireEvent.click(screen.getByRole('button'));

    const modelIdInput = screen.getByLabelText(/Provider.add_model_dialog_model_id/);
    fireEvent.change(modelIdInput, { target: { value: 'gpt-4-turbo' } });

    fireEvent.click(screen.getByText('Provider.add_model_dialog_ok'));

    expect(mockOnAdd).toHaveBeenCalledWith({
      id: 'gpt-4-turbo',
      name: 'gpt-4-turbo',
    });
  });

  it('should close dialog and reset form after submission', async () => {
    const { AddModelDialog } = await import('./AddModelDialog');
    render(<AddModelDialog onAdd={mockOnAdd} />);

    fireEvent.click(screen.getByRole('button'));

    const modelIdInput = screen.getByLabelText(/Provider.add_model_dialog_model_id/);
    fireEvent.change(modelIdInput, { target: { value: 'gpt-4-turbo' } });
    fireEvent.click(screen.getByText('Provider.add_model_dialog_ok'));

    await waitFor(() => {
      expect(screen.queryByText('Provider.add_model_dialog_title')).not.toBeInTheDocument();
    });
  });

  it('should close dialog when cancel button is clicked', async () => {
    const { AddModelDialog } = await import('./AddModelDialog');
    render(<AddModelDialog onAdd={mockOnAdd} />);

    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Provider.add_model_dialog_title')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Provider.add_model_dialog_cancel'));

    await waitFor(() => {
      expect(screen.queryByText('Provider.add_model_dialog_title')).not.toBeInTheDocument();
    });
  });

  it('should reset form when dialog is reopened', async () => {
    const { AddModelDialog } = await import('./AddModelDialog');
    render(<AddModelDialog onAdd={mockOnAdd} />);

    // Open and fill form
    fireEvent.click(screen.getByRole('button'));
    const modelIdInput = screen.getByLabelText(/Provider.add_model_dialog_model_id/);
    fireEvent.change(modelIdInput, { target: { value: 'gpt-4-turbo' } });

    // Close dialog
    fireEvent.click(screen.getByText('Provider.add_model_dialog_cancel'));

    // Reopen dialog
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button'));
    });

    const newModelIdInput = screen.getByLabelText(/Provider.add_model_dialog_model_id/);
    expect(newModelIdInput).toHaveValue('');
  });
});
