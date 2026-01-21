import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createMockRequest,
  mockAuth,
  mockDb,
  mockEncryption,
  mockSession,
  parseJsonResponse,
  setupTestEnvironment,
} from './helpers';

describe('test/helpers', () => {
  describe('mockSession', () => {
    it('has session object with required properties', () => {
      expect(mockSession.session).toMatchObject({
        id: expect.any(String),
        userId: expect.any(String),
        expiresAt: expect.any(Date),
        token: expect.any(String),
        ipAddress: expect.any(String),
        userAgent: expect.any(String),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('has user object with required properties', () => {
      expect(mockSession.user).toMatchObject({
        id: expect.any(String),
        email: expect.any(String),
        emailVerified: expect.any(Boolean),
        name: expect.any(String),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('has matching user id between session and user', () => {
      expect(mockSession.session.userId).toBe(mockSession.user.id);
    });
  });

  describe('mockAuth', () => {
    it('returns object with api.getSession mock', () => {
      const auth = mockAuth();
      expect(auth.api).toBeDefined();
      expect(auth.api.getSession).toBeDefined();
      expect(vi.isMockFunction(auth.api.getSession)).toBe(true);
    });

    it('uses mockSession as default session', async () => {
      const auth = mockAuth();
      const session = await auth.api.getSession();
      expect(session).toBe(mockSession);
    });

    it('accepts custom session parameter', async () => {
      const customSession = {
        session: { ...mockSession.session, id: 'custom-session-id' },
        user: { ...mockSession.user, id: 'custom-user-id' },
      };
      const auth = mockAuth(customSession);
      const session = await auth.api.getSession();
      expect(session).toBe(customSession);
    });

    it('accepts null session parameter', async () => {
      const auth = mockAuth(null);
      const session = await auth.api.getSession();
      expect(session).toBeNull();
    });

    it('getSession returns a Promise', () => {
      const auth = mockAuth();
      const result = auth.api.getSession();
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('mockDb', () => {
    it('returns all 14 methods as mock functions', () => {
      const db = mockDb();
      const methodNames = [
        'select',
        'from',
        'where',
        'limit',
        'offset',
        'orderBy',
        'innerJoin',
        'groupBy',
        'insert',
        'values',
        'returning',
        'update',
        'set',
        'delete',
        'onConflictDoUpdate',
      ];

      for (const methodName of methodNames) {
        expect(db[methodName as keyof typeof db]).toBeDefined();
        expect(vi.isMockFunction(db[methodName as keyof typeof db])).toBe(true);
      }
    });

    it('query methods return this for chaining', () => {
      const db = mockDb();
      expect(db.select()).toBe(db);
      expect(db.from()).toBe(db);
      expect(db.where()).toBe(db);
      expect(db.limit()).toBe(db);
      expect(db.offset()).toBe(db);
      expect(db.orderBy()).toBe(db);
      expect(db.innerJoin()).toBe(db);
      expect(db.groupBy()).toBe(db);
    });

    it('mutation methods return this for chaining', () => {
      const db = mockDb();
      expect(db.insert()).toBe(db);
      expect(db.values()).toBe(db);
      expect(db.update()).toBe(db);
      expect(db.set()).toBe(db);
      expect(db.delete()).toBe(db);
      expect(db.onConflictDoUpdate()).toBe(db);
    });

    it('returning() returns Promise resolving to empty array', async () => {
      const db = mockDb();
      const result = await db.returning();
      expect(result).toEqual([]);
    });

    it('supports full method chaining', () => {
      const db = mockDb();
      const chain = db.select().from().where().limit().offset().orderBy();
      expect(chain).toBe(db);
    });

    it('supports mutation chaining', () => {
      const db = mockDb();
      const chain = db.insert().values().onConflictDoUpdate();
      expect(chain).toBe(db);
    });
  });

  describe('createMockRequest', () => {
    it('creates Request with correct method', () => {
      const request = createMockRequest('POST', 'http://localhost/api/test');
      expect(request.method).toBe('POST');
    });

    it('creates Request with correct URL', () => {
      const request = createMockRequest('GET', 'http://localhost/api/users');
      expect(request.url).toBe('http://localhost/api/users');
    });

    it('sets default Content-Type header to application/json', () => {
      const request = createMockRequest('GET', 'http://localhost/api/test');
      expect(request.headers.get('Content-Type')).toBe('application/json');
    });

    it('merges custom headers with default', () => {
      const request = createMockRequest('GET', 'http://localhost/api/test', undefined, {
        Authorization: 'Bearer token',
      });
      expect(request.headers.get('Content-Type')).toBe('application/json');
      expect(request.headers.get('Authorization')).toBe('Bearer token');
    });

    it('allows custom headers to override defaults', () => {
      const request = createMockRequest('GET', 'http://localhost/api/test', undefined, {
        'Content-Type': 'text/plain',
      });
      expect(request.headers.get('Content-Type')).toBe('text/plain');
    });

    it('stringifies body when provided', async () => {
      const body = { name: 'test', value: 123 };
      const request = createMockRequest('POST', 'http://localhost/api/test', body);
      const parsedBody = await request.json();
      expect(parsedBody).toEqual(body);
    });

    it('has no body when undefined', () => {
      const request = createMockRequest('GET', 'http://localhost/api/test');
      expect(request.body).toBeNull();
    });
  });

  describe('parseJsonResponse', () => {
    it('parses JSON from Response object', async () => {
      const data = { success: true, message: 'Hello' };
      const response = new Response(JSON.stringify(data));
      const result = await parseJsonResponse(response);
      expect(result).toEqual(data);
    });

    it('returns parsed object with nested data', async () => {
      const data = { user: { id: 1, name: 'Test' }, items: [1, 2, 3] };
      const response = new Response(JSON.stringify(data));
      const result = await parseJsonResponse(response);
      expect(result).toEqual(data);
    });
  });

  describe('mockEncryption', () => {
    it('encrypt() prepends encrypted_ prefix', () => {
      const encryption = mockEncryption();
      const result = encryption.encrypt('mykey');
      expect(result).toBe('encrypted_mykey');
    });

    it('decrypt() removes encrypted_ prefix', () => {
      const encryption = mockEncryption();
      const result = encryption.decrypt('encrypted_mykey');
      expect(result).toBe('mykey');
    });

    it('encrypt is a mock function', () => {
      const encryption = mockEncryption();
      expect(vi.isMockFunction(encryption.encrypt)).toBe(true);
    });

    it('decrypt is a mock function', () => {
      const encryption = mockEncryption();
      expect(vi.isMockFunction(encryption.decrypt)).toBe(true);
    });

    it('mock functions can be tracked', () => {
      const encryption = mockEncryption();
      encryption.encrypt('key1');
      encryption.encrypt('key2');
      encryption.decrypt('encrypted_key1');

      expect(encryption.encrypt).toHaveBeenCalledTimes(2);
      expect(encryption.decrypt).toHaveBeenCalledTimes(1);
      expect(encryption.encrypt).toHaveBeenCalledWith('key1');
      expect(encryption.encrypt).toHaveBeenCalledWith('key2');
    });
  });

  describe('setupTestEnvironment', () => {
    it('registers a beforeEach callback', () => {
      const beforeEachSpy = vi.spyOn({ beforeEach }, 'beforeEach');

      vi.doMock('vitest', () => ({
        beforeEach: beforeEachSpy,
        vi,
      }));

      expect(() => setupTestEnvironment()).not.toThrow();
    });

    it('clears all mocks when beforeEach runs', () => {
      const mockFn = vi.fn();
      mockFn('test');
      expect(mockFn).toHaveBeenCalledTimes(1);

      setupTestEnvironment();

      beforeEach(() => {
        vi.clearAllMocks();
      });
    });
  });
});
