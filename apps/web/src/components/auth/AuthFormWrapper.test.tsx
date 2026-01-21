import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./SignInForm', () => ({
  SignInForm: ({ callbackUrl, showOAuth }: { callbackUrl?: string; showOAuth?: boolean }) => (
    <div
      data-testid="sign-in-form"
      data-callback={callbackUrl || ''}
      data-oauth={String(showOAuth)}
    />
  ),
}));

vi.mock('./SignUpForm', () => ({
  SignUpForm: ({ callbackUrl, showOAuth }: { callbackUrl?: string; showOAuth?: boolean }) => (
    <div
      data-testid="sign-up-form"
      data-callback={callbackUrl || ''}
      data-oauth={String(showOAuth)}
    />
  ),
}));

describe('AuthFormWrapper', () => {
  afterEach(() => {
    cleanup();
    vi.resetModules();
  });

  it('should render SignInForm when type is signin', async () => {
    vi.doMock('@lmring/env', () => ({
      env: {
        NEXT_PUBLIC_DEPLOYMENT_MODE: 'saas',
      },
    }));
    const { AuthFormWrapper } = await import('./AuthFormWrapper');
    render(<AuthFormWrapper type="signin" />);
    expect(screen.getByTestId('sign-in-form')).toBeInTheDocument();
  });

  it('should render SignUpForm when type is signup', async () => {
    vi.doMock('@lmring/env', () => ({
      env: {
        NEXT_PUBLIC_DEPLOYMENT_MODE: 'saas',
      },
    }));
    const { AuthFormWrapper } = await import('./AuthFormWrapper');
    render(<AuthFormWrapper type="signup" />);
    expect(screen.getByTestId('sign-up-form')).toBeInTheDocument();
  });

  it('should pass callbackUrl to SignInForm', async () => {
    vi.doMock('@lmring/env', () => ({
      env: {
        NEXT_PUBLIC_DEPLOYMENT_MODE: 'saas',
      },
    }));
    const { AuthFormWrapper } = await import('./AuthFormWrapper');
    render(<AuthFormWrapper type="signin" callbackUrl="/custom-callback" />);
    const form = screen.getByTestId('sign-in-form');
    expect(form).toHaveAttribute('data-callback', '/custom-callback');
  });

  it('should pass callbackUrl to SignUpForm', async () => {
    vi.doMock('@lmring/env', () => ({
      env: {
        NEXT_PUBLIC_DEPLOYMENT_MODE: 'saas',
      },
    }));
    const { AuthFormWrapper } = await import('./AuthFormWrapper');
    render(<AuthFormWrapper type="signup" callbackUrl="/custom-callback" />);
    const form = screen.getByTestId('sign-up-form');
    expect(form).toHaveAttribute('data-callback', '/custom-callback');
  });

  it('should show OAuth in saas mode', async () => {
    vi.doMock('@lmring/env', () => ({
      env: {
        NEXT_PUBLIC_DEPLOYMENT_MODE: 'saas',
      },
    }));
    const { AuthFormWrapper } = await import('./AuthFormWrapper');
    render(<AuthFormWrapper type="signin" />);
    const form = screen.getByTestId('sign-in-form');
    expect(form).toHaveAttribute('data-oauth', 'true');
  });

  it('should hide OAuth in self-hosted mode', async () => {
    vi.doMock('@lmring/env', () => ({
      env: {
        NEXT_PUBLIC_DEPLOYMENT_MODE: 'self-hosted',
      },
    }));
    const { AuthFormWrapper } = await import('./AuthFormWrapper');
    render(<AuthFormWrapper type="signin" />);
    const form = screen.getByTestId('sign-in-form');
    expect(form).toHaveAttribute('data-oauth', 'false');
  });
});
