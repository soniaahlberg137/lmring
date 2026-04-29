import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Headers()),
}));

const getSessionMock = vi.fn();

vi.mock('@/libs/Auth', () => ({
  auth: {
    api: {
      get getSession() {
        return getSessionMock;
      },
    },
  },
}));

beforeEach(() => {
  getSessionMock.mockReset();
  vi.resetModules();
});

describe('getCachedUser', () => {
  it('returns null when no session', async () => {
    getSessionMock.mockResolvedValue(null);
    const { getCachedUser } = await import('./get-cached-user');
    expect(await getCachedUser()).toBeNull();
  });

  it('maps session.user to UI shape', async () => {
    getSessionMock.mockResolvedValue({
      user: { name: 'Alice', email: 'a@x.com', image: 'https://img/a.png' },
    });
    const { getCachedUser } = await import('./get-cached-user');
    expect(await getCachedUser()).toEqual({
      name: 'Alice',
      email: 'a@x.com',
      image: 'https://img/a.png',
    });
  });

  it('falls back to email when name is missing and default avatar when image is missing', async () => {
    getSessionMock.mockResolvedValue({
      user: { name: '', email: 'b@x.com', image: null },
    });
    const { getCachedUser } = await import('./get-cached-user');
    expect(await getCachedUser()).toEqual({
      name: 'b@x.com',
      email: 'b@x.com',
      image: 'https://github.com/shadcn.png',
    });
  });

  it('returns the same mapped value on repeated calls', async () => {
    getSessionMock.mockResolvedValue({
      user: { name: 'C', email: 'c@x.com', image: 'i' },
    });
    const { getCachedUser } = await import('./get-cached-user');
    const first = await getCachedUser();
    const second = await getCachedUser();
    expect(second).toEqual(first);
  });
});
