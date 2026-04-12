// Lambda function: Register new user
// POST /auth/register

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { RegisterRequest, RegisterResponse } from '../../types/api';
import { createUser, getUserByEmail, userToProfile } from '../../shared/db/users';
import { hashPassword, validatePassword } from '../../shared/auth/password';
import { generateToken } from '../../shared/auth/jwt';
import { successResponseWithCookie, errorResponse } from '../../shared/utils/response';
import { isValidEmail, validateRequiredFields, sanitizeString } from '../../shared/utils/validation';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Parse request body
    if (!event.body) {
      return errorResponse('Request body is required', 400);
    }

    const body: RegisterRequest = JSON.parse(event.body);

    // Validate required fields
    const validation = validateRequiredFields(body, ['email', 'password', 'name']);
    if (!validation.valid) {
      return errorResponse(`Missing required fields: ${validation.missing?.join(', ')}`, 400);
    }

    // Validate email format
    if (!isValidEmail(body.email)) {
      return errorResponse('Invalid email format', 400);
    }

    // Validate password strength
    const passwordValidation = validatePassword(body.password);
    if (!passwordValidation.valid) {
      return errorResponse(passwordValidation.message || 'Invalid password', 400);
    }

    // Sanitize inputs
    const email = sanitizeString(body.email.toLowerCase(), 100);
    const name = sanitizeString(body.name, 100);
    const dietaryRestrictions = body.dietaryRestrictions
      ? sanitizeString(body.dietaryRestrictions, 500)
      : undefined;

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return errorResponse('User with this email already exists', 409);
    }

    // Hash password
    const passwordHash = await hashPassword(body.password);

    // Create user
    const userId = uuidv4();
    const user = await createUser(userId, email, passwordHash, name, dietaryRestrictions);

    // Generate JWT token
    const token = generateToken(user.userId, user.email);

    // Response data
    const responseData: RegisterResponse = {
      message: 'User registered successfully',
      userId: user.userId,
    };

    // Return success with token in httpOnly cookie
    return successResponseWithCookie(
      {
        ...responseData,
        user: userToProfile(user),
        token, // Also return in body for non-cookie clients
      },
      'token',
      token
    );
  } catch (error) {
    console.error('Register error:', error);

    if (error instanceof Error) {
      return errorResponse(error.message, 500);
    }

    return errorResponse('Internal server error', 500);
  }
}
