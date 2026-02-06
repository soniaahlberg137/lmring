import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
  mockSignUpEmail: vi.fn(),
  mockSignInSocial: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mocks.mockPush,
    refresh: mocks.mockRefresh,
  }),
}));

vi.mock('@/utils/redirect', () => ({
  sanitizeCallbackUrl: (url: string) => url || '/arena',
}));

vi.mock('@/libs/AuthClient', () => ({
  authClient: {
    signUp: {
      email: mocks.mockSignUpEmail,
    },
    signIn: {
      social: mocks.mockSignInSocial,
    },
  },
}));

vi.mock('@lmring/auth/shared', () => ({
  PASSWORD_RULES: {
    minLength: 8,
    maxLength: 128,
  },
  validatePassword: (password: string) => {
    const checks = [
      { rule: 'minLength', passed: password.length >= 8, message: 'At least 8 characters' },
      { rule: 'lowercase', passed: /[a-z]/.test(password), message: 'One lowercase letter' },
      { rule: 'uppercase', passed: /[A-Z]/.test(password), message: 'One uppercase letter' },
      { rule: 'number', passed: /\d/.test(password), message: 'One number' },
    ];
    const valid = checks.every((c) => c.passed);
    const errors = checks.filter((c) => !c.passed).map((c) => c.message);
    return { valid, checks, errors };
  },
}));

describe('SignUpForm', () => {
  beforeEach(() => {
    mocks.mockPush.mockClear();
    mocks.mockRefresh.mockClear();
    mocks.mockSignUpEmail.mockClear();
    mocks.mockSignInSocial.mockClear();
    mocks.mockSignUpEmail.mockResolvedValue({});
    mocks.mockSignInSocial.mockResolvedValue({});
  });

  afterEach(() => {
    cleanup();
  });

  it('should render all form fields', async () => {
    const { SignUpForm } = await import('./SignUpForm');
    render(<SignUpForm />);

    expect(screen.getByLabelText('Name (Optional)')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
  });

  it('should render sign up button', async () => {
    const { SignUpForm } = await import('./SignUpForm');
    render(<SignUpForm />);

    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
  });

  it('should not show OAuth buttons by default', async () => {
    const { SignUpForm } = await import('./SignUpForm');
    render(<SignUpForm />);

    expect(screen.queryByText('GitHub')).not.toBeInTheDocument();
    expect(screen.queryByText('Google')).not.toBeInTheDocument();
  });

  it('should show OAuth buttons when showOAuth is true', async () => {
    const { SignUpForm } = await import('./SignUpForm');
    render(<SignUpForm showOAuth />);

    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('Google')).toBeInTheDocument();
  });

  it('should update form fields', async () => {
    const { SignUpForm } = await import('./SignUpForm');
    render(<SignUpForm />);

    fireEvent.change(screen.getByLabelText('Name (Optional)'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'Password123!' },
    });

    expect((screen.getByLabelText('Name (Optional)') as HTMLInputElement).value).toBe('Test User');
    expect((screen.getByLabelText('Email') as HTMLInputElement).value).toBe('test@example.com');
  });

  it('should show error when passwords do not match', async () => {
    const { SignUpForm } = await import('./SignUpForm');
    render(<SignUpForm />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'DifferentPassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('should show password strength indicators', async () => {
    const { SignUpForm } = await import('./SignUpForm');
    render(<SignUpForm />);

    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'weak' } });

    expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
  });

  it('should submit form and redirect on success', async () => {
    const { SignUpForm } = await import('./SignUpForm');
    render(<SignUpForm />);

    fireEvent.change(screen.getByLabelText('Name (Optional)'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password1' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'Password1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    await waitFor(() => {
      expect(mocks.mockSignUpEmail).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password1',
        name: 'Test User',
      });
      expect(mocks.mockPush).toHaveBeenCalledWith('/arena');
    });
  });

  it('should display error message on failed sign up', async () => {
    mocks.mockSignUpEmail.mockResolvedValue({ error: { message: 'Email already exists' } });

    const { SignUpForm } = await import('./SignUpForm');
    render(<SignUpForm />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password1' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'Password1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });
  });

  it('should toggle password visibility', async () => {
    const { SignUpForm } = await import('./SignUpForm');
    render(<SignUpForm />);

    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });

    expect(passwordInput.type).toBe('password');

    const toggleButtons = screen.getAllByLabelText('Show password');
    fireEvent.click(toggleButtons[0] as HTMLElement);

    expect(passwordInput.type).toBe('text');
  });

  it('should handle OAuth sign up with GitHub', async () => {
    const { SignUpForm } = await import('./SignUpForm');
    render(<SignUpForm showOAuth />);

    fireEvent.click(screen.getByText('GitHub'));

    await waitFor(() => {
      expect(mocks.mockSignInSocial).toHaveBeenCalledWith({
        provider: 'github',
        callbackURL: '/arena',
        errorCallbackURL: '/sign-in',
      });
    });
  });

  it('should show loading state during submission', async () => {
    mocks.mockSignUpEmail.mockImplementation(() => new Promise(() => {}));

    const { SignUpForm } = await import('./SignUpForm');
    render(<SignUpForm />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password1' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'Password1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    await waitFor(() => {
      expect(screen.getByText('Creating account...')).toBeInTheDocument();
    });
  });

  it('should validate password complexity', async () => {
    const { SignUpForm } = await import('./SignUpForm');
    const { container } = render(<SignUpForm />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'weak' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'weak' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    await waitFor(() => {
      const text = container.textContent;
      expect(text).toContain('At least 8 characters');
    });
  });
});
