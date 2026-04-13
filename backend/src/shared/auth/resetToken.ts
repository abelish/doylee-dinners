// Reset token utilities

import crypto from 'crypto';

/**
 * Generate a cryptographically secure random reset token
 * Returns a 64-character hex string (256 bits of entropy)
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a reset token using SHA-256
 * Used to securely store tokens in the database
 */
export function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Validate reset token format
 * Ensures token is exactly 64 hexadecimal characters
 */
export function validateResetTokenFormat(token: string): boolean {
  return /^[0-9a-f]{64}$/i.test(token);
}
