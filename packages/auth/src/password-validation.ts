/**
 * Password validation rules and utilities
 * Shared between frontend and backend for consistent validation
 */

/**
 * Password validation rules configuration
 */
export const PASSWORD_RULES = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
} as const;

/**
 * Individual password rule check result
 */
export interface PasswordRuleCheck {
  rule: string;
  passed: boolean;
  message: string;
}

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  valid: boolean;
  checks: PasswordRuleCheck[];
  errors: string[];
}

/**
 * Check if password meets all complexity requirements
 */
export function validatePassword(password: string): PasswordValidationResult {
  const checks: PasswordRuleCheck[] = [];

  // Min length check
  const minLengthPassed = password.length >= PASSWORD_RULES.minLength;
  checks.push({
    rule: 'minLength',
    passed: minLengthPassed,
    message: `At least ${PASSWORD_RULES.minLength} characters`,
  });

  // Max length check
  const maxLengthPassed = password.length <= PASSWORD_RULES.maxLength;
  checks.push({
    rule: 'maxLength',
    passed: maxLengthPassed,
    message: `At most ${PASSWORD_RULES.maxLength} characters`,
  });

  // Uppercase check
  const uppercasePassed = /[A-Z]/.test(password);
  checks.push({
    rule: 'uppercase',
    passed: uppercasePassed,
    message: 'At least one uppercase letter',
  });

  // Lowercase check
  const lowercasePassed = /[a-z]/.test(password);
  checks.push({
    rule: 'lowercase',
    passed: lowercasePassed,
    message: 'At least one lowercase letter',
  });

  // Number check
  const numberPassed = /[0-9]/.test(password);
  checks.push({
    rule: 'number',
    passed: numberPassed,
    message: 'At least one number',
  });

  // Special character check
  const specialCharRegex = new RegExp(`[${escapeRegex(PASSWORD_RULES.specialChars)}]`);
  const specialCharPassed = specialCharRegex.test(password);
  checks.push({
    rule: 'specialChar',
    passed: specialCharPassed,
    message: 'At least one special character',
  });

  const errors = checks.filter((check) => !check.passed).map((check) => check.message);

  return {
    valid: errors.length === 0,
    checks,
    errors,
  };
}

/**
 * Check individual password rules (for real-time UI feedback)
 */
export function getPasswordStrength(password: string): {
  score: number;
  level: 'weak' | 'fair' | 'good' | 'strong';
} {
  const result = validatePassword(password);
  const passedCount = result.checks.filter((check) => check.passed).length;
  const totalChecks = result.checks.length;
  const score = Math.round((passedCount / totalChecks) * 100);

  let level: 'weak' | 'fair' | 'good' | 'strong';
  if (score < 50) {
    level = 'weak';
  } else if (score < 75) {
    level = 'fair';
  } else if (score < 100) {
    level = 'good';
  } else {
    level = 'strong';
  }

  return { score, level };
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
