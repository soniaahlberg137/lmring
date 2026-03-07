import { describe, expect, it } from 'vitest';

import { getE2ECredentials } from './auth';

describe('getE2ECredentials', () => {
  it('returns credentials when both env values are present', () => {
    const credentials = getE2ECredentials({
      LMRING_E2E_EMAIL: 'user@example.com',
      LMRING_E2E_PASSWORD: 'password123',
    });

    expect(credentials).toEqual({
      email: 'user@example.com',
      password: 'password123',
    });
  });

  it('returns null when either env value is missing', () => {
    expect(getE2ECredentials({ LMRING_E2E_EMAIL: 'user@example.com' })).toBeNull();
    expect(getE2ECredentials({ LMRING_E2E_PASSWORD: 'password123' })).toBeNull();
  });
});
