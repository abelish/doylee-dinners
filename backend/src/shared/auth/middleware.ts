// Authentication middleware for Lambda functions

import { APIGatewayProxyEvent } from 'aws-lambda';
import { verifyToken } from './jwt';
import { getUserById, userToProfile } from '../db/users';
import { AuthenticatedEvent } from '../../types/api';

/**
 * Extract JWT token from event (cookie or Authorization header)
 */
export function extractToken(event: APIGatewayProxyEvent): string | null {
  // Try Authorization header first
  const authHeader = event.headers.Authorization || event.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try cookie
  const cookies = event.headers.Cookie || event.headers.cookie;
  if (cookies) {
    const tokenMatch = cookies.match(/token=([^;]+)/);
    if (tokenMatch) {
      return tokenMatch[1];
    }
  }

  return null;
}

/**
 * Authenticate request and return user info
 * Throws error if authentication fails
 */
export async function authenticateRequest(
  event: APIGatewayProxyEvent
): Promise<AuthenticatedEvent> {
  const token = extractToken(event);

  if (!token) {
    throw new Error('No authentication token provided');
  }

  try {
    const payload = verifyToken(token);

    // Optionally fetch full user profile
    const user = await getUserById(payload.userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      userId: payload.userId,
      user: userToProfile(user),
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
    throw new Error('Authentication failed');
  }
}
