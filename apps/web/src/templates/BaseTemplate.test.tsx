import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { BaseTemplate } from './BaseTemplate';

// Mock dependencies
vi.mock('@lmring/ui', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
  ResizableHandle: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="resizable-handle">{children}</div>
  ),
  ResizablePanel: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="resizable-panel">{children}</div>
  ),
  ResizablePanelGroup: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="resizable-panel-group">{children}</div>
  ),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    header: 'header',
    footer: 'footer',
    main: 'main',
    aside: 'aside',
  },
}));

vi.mock('@/hooks/use-translations', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/utils/AppConfig', () => ({
  AppConfig: { name: 'TestApp' },
}));

describe('BaseTemplate', () => {
  afterEach(() => {
    cleanup();
  });

  describe('Basic Rendering', () => {
    it('renders children content', () => {
      render(
        <BaseTemplate>
          <div data-testid="child-content">Test Content</div>
        </BaseTemplate>,
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('renders header area with app name', () => {
      render(<BaseTemplate>Content</BaseTemplate>);

      const header = screen.getByRole('banner');
      const heading = within(header).getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('TestApp');
    });

    it('renders logo with first letter of app name', () => {
      render(<BaseTemplate>Content</BaseTemplate>);

      const header = screen.getByRole('banner');
      // The logo shows the first letter of AppConfig.name inside a span
      const logoSpan = within(header).getByText('T');
      expect(logoSpan).toBeInTheDocument();
    });

    it('renders footer area with copyright information', () => {
      render(<BaseTemplate>Content</BaseTemplate>);

      const footer = screen.getByRole('contentinfo');
      const currentYear = new Date().getFullYear();
      expect(within(footer).getByText(`© ${currentYear} TestApp`)).toBeInTheDocument();
    });

    it('renders online status indicator', () => {
      render(<BaseTemplate>Content</BaseTemplate>);

      const footer = screen.getByRole('contentinfo');
      expect(within(footer).getByText('Online')).toBeInTheDocument();
    });
  });

  describe('Sidebar Behavior', () => {
    it('renders ResizablePanelGroup when showSidebar is true (default) and leftNav is provided', () => {
      render(<BaseTemplate leftNav={<li>Nav Item</li>}>Content</BaseTemplate>);

      expect(screen.getByTestId('resizable-panel-group')).toBeInTheDocument();
      expect(screen.getByTestId('resizable-handle')).toBeInTheDocument();
      expect(screen.getAllByTestId('resizable-panel')).toHaveLength(2);
    });

    it('does not render ResizablePanelGroup when showSidebar is false', () => {
      render(
        <BaseTemplate showSidebar={false} leftNav={<li>Nav Item</li>}>
          Content
        </BaseTemplate>,
      );

      expect(screen.queryByTestId('resizable-panel-group')).not.toBeInTheDocument();
      expect(screen.queryByTestId('resizable-handle')).not.toBeInTheDocument();
    });

    it('does not render ResizablePanelGroup when leftNav is not provided', () => {
      render(<BaseTemplate showSidebar={true}>Content</BaseTemplate>);

      expect(screen.queryByTestId('resizable-panel-group')).not.toBeInTheDocument();
    });

    it('renders main content directly when sidebar is hidden', () => {
      render(
        <BaseTemplate showSidebar={false}>
          <div data-testid="main-content">Main Content</div>
        </BaseTemplate>,
      );

      expect(screen.getByTestId('main-content')).toBeInTheDocument();
      expect(screen.getByText('Main Content')).toBeInTheDocument();
    });
  });

  describe('Navigation Slots', () => {
    it('renders leftNav prop in sidebar', () => {
      render(
        <BaseTemplate leftNav={<li data-testid="left-nav-item">Left Nav</li>}>
          Content
        </BaseTemplate>,
      );

      expect(screen.getByTestId('left-nav-item')).toBeInTheDocument();
      expect(screen.getByText('Left Nav')).toBeInTheDocument();
    });

    it('renders rightNav prop in header', () => {
      render(
        <BaseTemplate rightNav={<li data-testid="right-nav-item">Right Nav</li>}>
          Content
        </BaseTemplate>,
      );

      expect(screen.getByTestId('right-nav-item')).toBeInTheDocument();
      expect(screen.getByText('Right Nav')).toBeInTheDocument();
    });

    it('renders both leftNav and rightNav together', () => {
      render(
        <BaseTemplate
          leftNav={<li data-testid="left-nav">Left</li>}
          rightNav={<li data-testid="right-nav">Right</li>}
        >
          Content
        </BaseTemplate>,
      );

      expect(screen.getByTestId('left-nav')).toBeInTheDocument();
      expect(screen.getByTestId('right-nav')).toBeInTheDocument();
    });

    it('renders normally without nav props', () => {
      render(<BaseTemplate>Content</BaseTemplate>);

      expect(screen.getByText('Content')).toBeInTheDocument();
      const header = screen.getByRole('banner');
      expect(within(header).getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });

  describe('i18n Integration', () => {
    it('uses BaseTemplate.description translation key', () => {
      render(<BaseTemplate>Content</BaseTemplate>);

      const header = screen.getByRole('banner');
      // The mocked useTranslations returns the key as-is
      expect(within(header).getByText('BaseTemplate.description')).toBeInTheDocument();
    });

    it('displays AppConfig.name in header', () => {
      render(<BaseTemplate>Content</BaseTemplate>);

      const header = screen.getByRole('banner');
      expect(within(header).getByText('TestApp')).toBeInTheDocument();
    });

    it('displays AppConfig.name in footer copyright', () => {
      render(<BaseTemplate>Content</BaseTemplate>);

      const footer = screen.getByRole('contentinfo');
      const currentYear = new Date().getFullYear();
      expect(within(footer).getByText(`© ${currentYear} TestApp`)).toBeInTheDocument();
    });
  });

  describe('Layout Structure', () => {
    it('has flex layout that fills screen height', () => {
      const { container } = render(<BaseTemplate>Content</BaseTemplate>);

      const rootDiv = container.firstChild as HTMLElement;
      expect(rootDiv).toHaveClass('flex', 'h-screen', 'w-full', 'flex-col');
    });

    it('header contains navigation element', () => {
      render(<BaseTemplate rightNav={<li>Nav</li>}>Content</BaseTemplate>);

      const header = screen.getByRole('banner');
      const nav = within(header).getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('sidebar contains main navigation when leftNav is provided', () => {
      render(<BaseTemplate leftNav={<li>Sidebar Nav</li>}>Content</BaseTemplate>);

      const mainNav = screen.getByRole('navigation', { name: 'Main navigation' });
      expect(mainNav).toBeInTheDocument();
    });

    it('main area contains children content', () => {
      render(
        <BaseTemplate>
          <article data-testid="article">Article content</article>
        </BaseTemplate>,
      );

      const main = screen.getByRole('main');
      expect(main).toContainElement(screen.getByTestId('article'));
    });
  });
});
