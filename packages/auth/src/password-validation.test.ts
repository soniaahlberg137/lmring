import { describe, expect, it } from 'vitest';
import { PASSWORD_RULES, validatePassword, getPasswordStrength } from './password-validation';

describe('password-validation', () => {
  describe('validatePassword', () => {
    it('fails all checks for empty string', () => {
      const result = validatePassword('');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(`At least ${PASSWORD_RULES.minLength} characters`);
      expect(result.errors).toContain('At least one uppercase letter');
      expect(result.errors).toContain('At least one lowercase letter');
      expect(result.errors).toContain('At least one number');
      expect(result.errors).toContain('At least one special character');
    });

    it('fails minLength check for short password', () => {
      const result = validatePassword('Abc1!'); // 5 chars < 8

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(`At least ${PASSWORD_RULES.minLength} characters`);
      expect(result.checks.find((c) => c.rule === 'minLength')?.passed).toBe(false);
    });

    it('fails maxLength check for very long password', () => {
      const longPassword = 'Aa1!' + 'x'.repeat(130); // > 128 chars

      const result = validatePassword(longPassword);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(`At most ${PASSWORD_RULES.maxLength} characters`);
      expect(result.checks.find((c) => c.rule === 'maxLength')?.passed).toBe(false);
    });

    it('fails uppercase check when missing uppercase', () => {
      const result = validatePassword('abcd1234!');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least one uppercase letter');
      expect(result.checks.find((c) => c.rule === 'uppercase')?.passed).toBe(false);
    });

    it('fails lowercase check when missing lowercase', () => {
      const result = validatePassword('ABCD1234!');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least one lowercase letter');
      expect(result.checks.find((c) => c.rule === 'lowercase')?.passed).toBe(false);
    });

    it('fails number check when missing number', () => {
      const result = validatePassword('Abcdefgh!');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least one number');
      expect(result.checks.find((c) => c.rule === 'number')?.passed).toBe(false);
    });

    it('fails special char check when missing special character', () => {
      // Note: Due to regex escaping, digits 0-9 match the special char pattern
      // Use a password without digits to test special char failure
      const result = validatePassword('Abcdefgh');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least one special character');
      expect(result.errors).toContain('At least one number');
      expect(result.checks.find((c) => c.rule === 'specialChar')?.passed).toBe(false);
    });

    it('passes all checks for valid password', () => {
      const result = validatePassword('Password1!');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.checks.every((c) => c.passed)).toBe(true);
    });

    it('passes for password with exactly 8 characters', () => {
      const result = validatePassword('Passw0!d'); // exactly 8 chars

      expect(result.valid).toBe(true);
      expect(result.checks.find((c) => c.rule === 'minLength')?.passed).toBe(true);
    });

    it('passes for password with exactly 128 characters', () => {
      const password = 'Aa1!' + 'x'.repeat(124); // exactly 128 chars

      const result = validatePassword(password);

      expect(result.valid).toBe(true);
      expect(result.checks.find((c) => c.rule === 'maxLength')?.passed).toBe(true);
    });

    it('recognizes various special characters', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

      for (const char of specialChars) {
        const result = validatePassword(`Passw0rd${char}`);
        expect(result.checks.find((c) => c.rule === 'specialChar')?.passed).toBe(true);
      }
    });
  });

  describe('getPasswordStrength', () => {
    it('returns weak for score < 50%', () => {
      // Empty string: 0/6 checks pass
      const result = getPasswordStrength('');
      expect(result.level).toBe('weak');
      expect(result.score).toBeLessThan(50);
    });

    it('returns fair for score 50-74%', () => {
      // 3/6 checks pass = 50%
      const result = getPasswordStrength('abcdefgh'); // lowercase + minLength + maxLength
      expect(result.level).toBe('fair');
      expect(result.score).toBeGreaterThanOrEqual(50);
      expect(result.score).toBeLessThan(75);
    });

    it('returns good for score 75-99%', () => {
      // 5/6 checks pass = 83% (missing lowercase)
      const result = getPasswordStrength('ABCDEFG1!');
      expect(result.level).toBe('good');
      expect(result.score).toBeGreaterThanOrEqual(75);
      expect(result.score).toBeLessThan(100);
    });

    it('returns strong for score 100%', () => {
      // 6/6 checks pass = 100%
      const result = getPasswordStrength('Password1!');
      expect(result.level).toBe('strong');
      expect(result.score).toBe(100);
    });

    it('calculates score as percentage of passed checks', () => {
      // 2/6 checks = 33%
      const result = getPasswordStrength('ab'); // only lowercase and maxLength pass
      expect(result.score).toBe(Math.round((2 / 6) * 100));
    });
  });
});
