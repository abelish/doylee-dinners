// Standard API response helpers

import { APIGatewayProxyResult } from 'aws-lambda';
import { ApiResponse } from '../../types/api';

/**
 * Get CORS headers
 */
function getCorsHeaders(): Record<string, string> {
  const corsOrigin = process.env.CORS_ORIGIN || '*';

  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json',
  };
}

/**
 * Create a success response
 */
export function successResponse<T>(
  data: T,
  statusCode: number = 200,
  additionalHeaders?: Record<string, string>
): APIGatewayProxyResult {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };

  return {
    statusCode,
    headers: {
      ...getCorsHeaders(),
      ...additionalHeaders,
    },
    body: JSON.stringify(response),
  };
}

/**
 * Create an error response
 */
export function errorResponse(
  message: string,
  statusCode: number = 400,
  code?: string
): APIGatewayProxyResult {
  const response: ApiResponse = {
    success: false,
    error: {
      message,
      code,
    },
  };

  return {
    statusCode,
    headers: getCorsHeaders(),
    body: JSON.stringify(response),
  };
}

/**
 * Create a response with Set-Cookie header
 */
export function successResponseWithCookie(
  data: any,
  cookieName: string,
  cookieValue: string,
  maxAge: number = 604800 // 7 days in seconds
): APIGatewayProxyResult {
  // HttpOnly, Secure, SameSite=None for cross-site requests (frontend on CloudFront, API on API Gateway)
  const cookie = `${cookieName}=${cookieValue}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=None`;

  return successResponse(data, 200, {
    'Set-Cookie': cookie,
  });
}

/**
 * Clear cookie response
 */
export function clearCookieResponse(
  data: any,
  cookieName: string
): APIGatewayProxyResult {
  const cookie = `${cookieName}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=None`;

  return successResponse(data, 200, {
    'Set-Cookie': cookie,
  });
}
