// Update user profile

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { authenticateRequest } from '../../shared/auth/middleware';
import { updateUserProfile, userToProfile } from '../../shared/db/users';
import { successResponse, errorResponse } from '../../shared/utils/response';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Authenticate user
    const auth = await authenticateRequest(event);

    // Get userId from path
    const pathUserId = event.pathParameters?.userId;
    if (!pathUserId) {
      return errorResponse('User ID is required', 400);
    }

    // Users can only update their own profile
    if (auth.userId !== pathUserId) {
      return errorResponse('You can only update your own profile', 403);
    }

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { name, dietaryRestrictions } = body;

    // Validate at least one field is provided
    if (name === undefined && dietaryRestrictions === undefined) {
      return errorResponse('At least one field (name or dietaryRestrictions) must be provided', 400);
    }

    // Validate name if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return errorResponse('Name must be a non-empty string', 400);
      }
      if (name.length > 100) {
        return errorResponse('Name must be 100 characters or less', 400);
      }
    }

    // Validate dietary restrictions if provided
    if (dietaryRestrictions !== undefined) {
      if (typeof dietaryRestrictions !== 'string') {
        return errorResponse('Dietary restrictions must be a string', 400);
      }
      if (dietaryRestrictions.length > 500) {
        return errorResponse('Dietary restrictions must be 500 characters or less', 400);
      }
    }

    // Update user profile
    const updates: { name?: string; dietaryRestrictions?: string } = {};
    if (name !== undefined) updates.name = name.trim();
    if (dietaryRestrictions !== undefined) updates.dietaryRestrictions = dietaryRestrictions.trim() || '';

    const updatedUser = await updateUserProfile(auth.userId, updates);
    const profile = userToProfile(updatedUser);

    return successResponse({ user: profile, message: 'Profile updated successfully' });
  } catch (err: any) {
    console.error('Update profile error:', err);
    return errorResponse(err.message || 'Failed to update profile', 500);
  }
}
