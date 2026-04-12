// JWT token utilities

import * as jwt from 'jsonwebtoken';
import { JwtPayload } from '../../types/api';
import { getEnvVar } from '../../types/environment';

/**
 * Generate a JWT token for a user
 */
export function generateToken(userId: string, email: string): string {
  const secret = getEnvVar('JWT_SECRET');
  const payload: JwtPayload = {
    userId,
    email,
  };

  return jwt.sign(payload, secret, {
    expiresIn: '7d', // 7 days
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JwtPayload {
  const secret = getEnvVar('JWT_SECRET');

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Extract userId from token
 */
export function extractUserId(token: string): string {
  const payload = verifyToken(token);
  return payload.userId;
}
