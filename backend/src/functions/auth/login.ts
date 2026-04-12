// Lambda function: User login
// POST /auth/login

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { LoginRequest, LoginResponse } from '../../types/api';
import { getUserByEmail, userToProfile } from '../../shared/db/users';
import { comparePassword } from '../../shared/auth/password';
import { generateToken } from '../../shared/auth/jwt';
import { successResponseWithCookie, errorResponse } from '../../shared/utils/response';
import { isValidEmail, validateRequiredFields, sanitizeString } from '../../shared/utils/validation';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Parse request body
    if (!event.body) {
      return errorResponse('Request body is required', 400);
    }

    const body: LoginRequest = JSON.parse(event.body);

    // Validate required fields
    const validation = validateRequiredFields(body, ['email', 'password']);
    if (!validation.valid) {
      return errorResponse(`Missing required fields: ${validation.missing?.join(', ')}`, 400);
    }

    // Validate email format
    if (!isValidEmail(body.email)) {
      return errorResponse('Invalid email format', 400);
    }

    // Sanitize email
    const email = sanitizeString(body.email.toLowerCase(), 100);

    // Get user by email
    const user = await getUserByEmail(email);
    if (!user) {
      return errorResponse('Invalid email or password', 401);
    }

    // Compare password
    const passwordMatch = await comparePassword(body.password, user.passwordHash);
    if (!passwordMatch) {
      return errorResponse('Invalid email or password', 401);
    }

    // Generate JWT token
    const token = generateToken(user.userId, user.email);

    // Response data
    const responseData: LoginResponse = {
      user: userToProfile(user),
      token,
    };

    // Return success with token in httpOnly cookie
    return successResponseWithCookie(responseData, 'token', token);
  } catch (error) {
    console.error('Login error:', error);

    if (error instanceof Error) {
      return errorResponse(error.message, 500);
    }

    return errorResponse('Internal server error', 500);
  }
}
