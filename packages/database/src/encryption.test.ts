import { describe, expect, it, vi, beforeEach } from 'vitest';

// Test encryption key: 64 hex characters = 32 bytes
const { TEST_ENCRYPTION_KEY } = vi.hoisted(() => ({
  TEST_ENCRYPTION_KEY: 'a'.repeat(64),
}));

vi.mock('@lmring/env', () => ({
  env: {
    ENCRYPTION_KEY: TEST_ENCRYPTION_KEY,
  },
}));

import { encrypt, decrypt } from './encryption';

describe('encrypt', () => {
  it('returns string in iv:authTag:encrypted format', () => {
    const result = encrypt('test');
    const parts = result.split(':');
    expect(parts).toHaveLength(3);
    // IV is 16 bytes = 32 hex chars
    expect(parts[0]).toHaveLength(32);
    // Auth tag is 16 bytes = 32 hex chars
    expect(parts[1]).toHaveLength(32);
    // Encrypted content should exist
    expect(parts[2]?.length).toBeGreaterThan(0);
  });

  it('produces different outputs for same input (random IV)', () => {
    const result1 = encrypt('same input');
    const result2 = encrypt('same input');
    expect(result1).not.toBe(result2);
  });

  it('handles empty string', () => {
    const result = encrypt('');
    const parts = result.split(':');
    expect(parts).toHaveLength(3);
  });

  it('handles special characters and unicode', () => {
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`éèêëàâäùûüîïôöç中文日本語한국어🎉';
    const result = encrypt(specialChars);
    const parts = result.split(':');
    expect(parts).toHaveLength(3);
  });
});

describe('decrypt', () => {
  it('decrypts encrypted text back to original', () => {
    const original = 'hello world';
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it('throws for invalid format (missing colons)', () => {
    expect(() => decrypt('invalid')).toThrow('Invalid encrypted text format');
  });

  it('throws for empty string', () => {
    expect(() => decrypt('')).toThrow('Invalid encrypted text format');
  });

  it('throws for tampered authTag', () => {
    const encrypted = encrypt('test');
    const parts = encrypted.split(':');
    // Tamper with the auth tag
    parts[1] = 'b'.repeat(32);
    const tampered = parts.join(':');
    expect(() => decrypt(tampered)).toThrow();
  });
});

describe('roundtrip', () => {
  it('encrypts and decrypts plain text correctly', () => {
    const original = 'The quick brown fox jumps over the lazy dog';
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it('encrypts and decrypts JSON correctly', () => {
    const original = JSON.stringify({ key: 'value', number: 42, nested: { arr: [1, 2, 3] } });
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
    expect(JSON.parse(decrypted)).toEqual(JSON.parse(original));
  });
});
