// Get user profile

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { authenticateRequest } from '../../shared/auth/middleware';
import { getUserById, userToProfile } from '../../shared/db/users';
import { successResponse, errorResponse } from '../../shared/utils/response';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Authenticate user (just checking authentication, not using the result)
    await authenticateRequest(event);

    // Get userId from path
    const userId = event.pathParameters?.userId;
    if (!userId) {
      return errorResponse('User ID is required', 400);
    }

    // Get user
    const user = await getUserById(userId);
    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Convert to profile (removes password hash)
    const profile = userToProfile(user);

    return successResponse({ user: profile });
  } catch (err: any) {
    console.error('Get user error:', err);
    return errorResponse(err.message || 'Failed to get user', 500);
  }
}
