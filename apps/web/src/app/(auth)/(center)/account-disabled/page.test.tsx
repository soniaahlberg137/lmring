import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import AccountDisabledPage from './page';

describe('AccountDisabledPage', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render the page title', async () => {
    const PageComponent = await AccountDisabledPage();
    render(PageComponent);
    expect(screen.getByText('Account Disabled')).toBeInTheDocument();
  });

  it('should render the main message', async () => {
    const PageComponent = await AccountDisabledPage();
    render(PageComponent);
    expect(
      screen.getByText('Your account has been disabled by an administrator.'),
    ).toBeInTheDocument();
  });

  it('should render the contact support message', async () => {
    const PageComponent = await AccountDisabledPage();
    render(PageComponent);
    expect(
      screen.getByText('If you believe this is an error, please contact support.'),
    ).toBeInTheDocument();
  });

  it('should render the "What does this mean?" section', async () => {
    const PageComponent = await AccountDisabledPage();
    render(PageComponent);
    expect(screen.getByText('What does this mean?')).toBeInTheDocument();
    expect(
      screen.getByText(/Your account has been temporarily or permanently disabled/),
    ).toBeInTheDocument();
  });

  it('should render the "Need help?" section', async () => {
    const PageComponent = await AccountDisabledPage();
    render(PageComponent);
    expect(screen.getByText('Need help?')).toBeInTheDocument();
    expect(
      screen.getByText('Contact our support team for assistance with your account status.'),
    ).toBeInTheDocument();
  });

  it('should render the return to home link', async () => {
    const PageComponent = await AccountDisabledPage();
    render(PageComponent);
    const link = screen.getByRole('link', { name: /Return to home/ });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });

  it('should render warning icon', async () => {
    const PageComponent = await AccountDisabledPage();
    const { container } = render(PageComponent);
    const svg = container.querySelector('svg[aria-hidden="true"]');
    expect(svg).toBeInTheDocument();
  });
});
