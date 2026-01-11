/**
 * Client-safe shared utilities
 * These exports can be safely imported in client components
 */

// Password validation utilities
export {
  PASSWORD_RULES,
  validatePassword,
  getPasswordStrength,
} from './password-validation';
export type { PasswordRuleCheck, PasswordValidationResult } from './password-validation';
