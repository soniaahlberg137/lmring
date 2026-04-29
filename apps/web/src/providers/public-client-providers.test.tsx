import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PublicClientProviders } from './public-client-providers';

describe('PublicClientProviders', () => {
  it('renders children inside provider stack', () => {
    const { getByText } = render(
      <PublicClientProviders>
        <div>public-child</div>
      </PublicClientProviders>,
    );
    expect(getByText('public-child')).toBeTruthy();
  });
});
