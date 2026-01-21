import { describe, expect, it } from 'vitest';
import { API_ERRORS } from './error-constants';

describe('error-constants', () => {
  describe('API_ERRORS', () => {
    it('should have UNAUTHORIZED error', () => {
      expect(API_ERRORS.UNAUTHORIZED).toBe('Unauthorized');
    });

    it('should have VALIDATION_FAILED error', () => {
      expect(API_ERRORS.VALIDATION_FAILED).toBe('Validation failed');
    });

    it('should have TITLE_REQUIRED error', () => {
      expect(API_ERRORS.TITLE_REQUIRED).toBe('Title is required');
    });

    it('should have MESSAGE_ID_REQUIRED error', () => {
      expect(API_ERRORS.MESSAGE_ID_REQUIRED).toBe('messageId is required');
    });

    it('should have KEY_ID_REQUIRED error', () => {
      expect(API_ERRORS.KEY_ID_REQUIRED).toBe('Key ID is required');
    });

    it('should have VOTE_ID_REQUIRED error', () => {
      expect(API_ERRORS.VOTE_ID_REQUIRED).toBe('Vote ID is required');
    });

    it('should have CONVERSATION_NOT_FOUND error', () => {
      expect(API_ERRORS.CONVERSATION_NOT_FOUND).toBe('Conversation not found');
    });

    it('should have MESSAGE_NOT_FOUND error', () => {
      expect(API_ERRORS.MESSAGE_NOT_FOUND).toBe('Message not found or unauthorized');
    });

    it('should have MODEL_RESPONSE_NOT_FOUND error', () => {
      expect(API_ERRORS.MODEL_RESPONSE_NOT_FOUND).toBe('Model response not found');
    });

    it('should have API_KEY_NOT_FOUND error', () => {
      expect(API_ERRORS.API_KEY_NOT_FOUND).toBe('API key not found');
    });

    it('should have VOTE_NOT_FOUND error', () => {
      expect(API_ERRORS.VOTE_NOT_FOUND).toBe('Vote not found');
    });

    it('should have SHARED_RESULT_NOT_FOUND error', () => {
      expect(API_ERRORS.SHARED_RESULT_NOT_FOUND).toBe('Shared result not found');
    });

    it('should have SHARE_LINK_EXPIRED error', () => {
      expect(API_ERRORS.SHARE_LINK_EXPIRED).toBe('Share link has expired');
    });

    it('should have MODEL_ID_CONFLICTS_WITH_BUILTIN error', () => {
      expect(API_ERRORS.MODEL_ID_CONFLICTS_WITH_BUILTIN).toBe(
        'Model ID conflicts with a built-in model',
      );
    });

    it('should have INTERNAL_SERVER_ERROR error', () => {
      expect(API_ERRORS.INTERNAL_SERVER_ERROR).toBe('Internal server error');
    });

    it('should have all expected keys', () => {
      const expectedKeys = [
        'UNAUTHORIZED',
        'VALIDATION_FAILED',
        'TITLE_REQUIRED',
        'MESSAGE_ID_REQUIRED',
        'KEY_ID_REQUIRED',
        'VOTE_ID_REQUIRED',
        'CONVERSATION_NOT_FOUND',
        'MESSAGE_NOT_FOUND',
        'MODEL_RESPONSE_NOT_FOUND',
        'API_KEY_NOT_FOUND',
        'VOTE_NOT_FOUND',
        'SHARED_RESULT_NOT_FOUND',
        'SHARE_LINK_EXPIRED',
        'MODEL_ID_CONFLICTS_WITH_BUILTIN',
        'INTERNAL_SERVER_ERROR',
      ];

      expect(Object.keys(API_ERRORS)).toEqual(expect.arrayContaining(expectedKeys));
      expect(Object.keys(API_ERRORS)).toHaveLength(expectedKeys.length);
    });

    it('should have all non-empty string values', () => {
      for (const [_key, value] of Object.entries(API_ERRORS)) {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      }
    });
  });
});
