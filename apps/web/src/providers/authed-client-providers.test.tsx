import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuthedClientProviders } from './authed-client-providers';

describe('AuthedClientProviders', () => {
  it('renders children inside provider stack', () => {
    const { getByText } = render(
      <AuthedClientProviders>
        <div>child-content</div>
      </AuthedClientProviders>,
    );
    expect(getByText('child-content')).toBeTruthy();
  });
});
