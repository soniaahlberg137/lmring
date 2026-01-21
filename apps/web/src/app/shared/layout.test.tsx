import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SharedLayout from './layout';

describe('SharedLayout', () => {
  it('should render children', () => {
    render(
      <SharedLayout>
        <div data-testid="shared-content">Shared Content</div>
      </SharedLayout>,
    );

    expect(screen.getByTestId('shared-content')).toBeInTheDocument();
    expect(screen.getByText('Shared Content')).toBeInTheDocument();
  });

  it('should pass children through unchanged', () => {
    const { container } = render(
      <SharedLayout>
        <main>Main Content</main>
      </SharedLayout>,
    );

    expect(container.querySelector('main')).toBeInTheDocument();
    expect(screen.getByText('Main Content')).toBeInTheDocument();
  });
});
