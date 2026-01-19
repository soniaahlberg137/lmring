import { describe, expect, it } from 'vitest';
import { GET } from '@/app/api/health/route';
import { parseJsonResponse } from '@/test/helpers';

describe('Health API', () => {
  describe('GET /api/health', () => {
    it('should return ok status', async () => {
      const response = await GET();
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
    });

    it('should return timestamp in ISO format', async () => {
      const response = await GET();
      const data = await parseJsonResponse(response);

      expect(data.timestamp).toBeDefined();
      expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp);
    });
  });
});
