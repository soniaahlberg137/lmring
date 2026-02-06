import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
  mockSignInEmail: vi.fn(),
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
    signIn: {
      email: mocks.mockSignInEmail,
      social: mocks.mockSignInSocial,
    },
  },
}));

describe('SignInForm', () => {
  beforeEach(async () => {
    mocks.mockPush.mockClear();
    mocks.mockRefresh.mockClear();
    mocks.mockSignInEmail.mockClear();
    mocks.mockSignInSocial.mockClear();
    mocks.mockSignInEmail.mockResolvedValue({});
    mocks.mockSignInSocial.mockResolvedValue({});
  });

  afterEach(() => {
    cleanup();
  });

  it('should render email and password inputs', async () => {
    const { SignInForm } = await import('./SignInForm');
    render(<SignInForm />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('should render sign in button', async () => {
    const { SignInForm } = await import('./SignInForm');
    render(<SignInForm />);

    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('should not show OAuth buttons by default', async () => {
    const { SignInForm } = await import('./SignInForm');
    render(<SignInForm />);

    expect(screen.queryByText('GitHub')).not.toBeInTheDocument();
    expect(screen.queryByText('Google')).not.toBeInTheDocument();
  });

  it('should show OAuth buttons when showOAuth is true', async () => {
    const { SignInForm } = await import('./SignInForm');
    render(<SignInForm showOAuth />);

    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('Google')).toBeInTheDocument();
  });

  it('should update email input value', async () => {
    const { SignInForm } = await import('./SignInForm');
    render(<SignInForm />);

    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    expect(emailInput.value).toBe('test@example.com');
  });

  it('should update password input value', async () => {
    const { SignInForm } = await import('./SignInForm');
    render(<SignInForm />);

    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(passwordInput.value).toBe('password123');
  });

  it('should toggle password visibility', async () => {
    const { SignInForm } = await import('./SignInForm');
    render(<SignInForm />);

    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(passwordInput.type).toBe('password');

    const toggleButton = screen.getByLabelText('Show password');
    fireEvent.click(toggleButton);

    expect(passwordInput.type).toBe('text');
  });

  it('should submit form and redirect on success', async () => {
    const { SignInForm } = await import('./SignInForm');
    render(<SignInForm />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(mocks.mockSignInEmail).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mocks.mockPush).toHaveBeenCalledWith('/arena');
    });
  });

  it('should display error message on failed sign in', async () => {
    mocks.mockSignInEmail.mockResolvedValue({ error: { message: 'Invalid credentials' } });

    const { SignInForm } = await import('./SignInForm');
    render(<SignInForm />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('should use custom callback URL', async () => {
    const { SignInForm } = await import('./SignInForm');
    render(<SignInForm callbackUrl="/dashboard" />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(mocks.mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should handle OAuth sign in with GitHub', async () => {
    const { SignInForm } = await import('./SignInForm');
    render(<SignInForm showOAuth />);

    fireEvent.click(screen.getByText('GitHub'));

    await waitFor(() => {
      expect(mocks.mockSignInSocial).toHaveBeenCalledWith({
        provider: 'github',
        callbackURL: '/arena',
        errorCallbackURL: '/sign-in',
      });
    });
  });

  it('should handle OAuth sign in with Google', async () => {
    const { SignInForm } = await import('./SignInForm');
    render(<SignInForm showOAuth />);

    fireEvent.click(screen.getByText('Google'));

    await waitFor(() => {
      expect(mocks.mockSignInSocial).toHaveBeenCalledWith({
        provider: 'google',
        callbackURL: '/arena',
        errorCallbackURL: '/sign-in',
      });
    });
  });

  it('should show loading state during submission', async () => {
    mocks.mockSignInEmail.mockImplementation(() => new Promise(() => {}));

    const { SignInForm } = await import('./SignInForm');
    render(<SignInForm />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByText('Signing in...')).toBeInTheDocument();
    });
  });

  it('should disable inputs during loading', async () => {
    mocks.mockSignInEmail.mockImplementation(() => new Promise(() => {}));

    const { SignInForm } = await import('./SignInForm');
    render(<SignInForm />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Email')).toBeDisabled();
      expect(screen.getByLabelText('Password')).toBeDisabled();
    });
  });
});
