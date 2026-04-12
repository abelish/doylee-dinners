// Lambda function: Remove signup from meal
// DELETE /meals/{mealId}/signup

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { authenticateRequest } from '../../shared/auth/middleware';
import { getMealById, updateMeal } from '../../shared/db/meals';
import { deleteSignup, getUserMealParticipation, deleteUserMealParticipation } from '../../shared/db/signups';
import { successResponse, errorResponse } from '../../shared/utils/response';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Authenticate request
    const auth = await authenticateRequest(event);

    // Get mealId from path parameters
    const mealId = event.pathParameters?.mealId;
    if (!mealId) {
      return errorResponse('mealId is required', 400);
    }

    // Get meal
    const meal = await getMealById(mealId);
    if (!meal) {
      return errorResponse('Meal not found', 404);
    }

    // Get user's participation
    const participation = await getUserMealParticipation(auth.userId, mealId);
    if (!participation) {
      return errorResponse('You are not signed up for this meal', 400);
    }

    // Handle different roles
    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (participation.role === 'COOK') {
      // Clear cook
      updates.cookId = null;
      updates.cookName = null;

      await updateMeal(mealId, updates);
    } else if (participation.role === 'ASSISTANT') {
      // Clear assistant
      updates.assistantId = null;
      updates.assistantName = null;

      await updateMeal(mealId, updates);
    } else {
      // DINER role - delete signup
      await deleteSignup(mealId, auth.userId);

      // Update meal status if was full
      if (meal.status === 'FULL') {
        updates.status = 'OPEN';
      }

      if (Object.keys(updates).length > 1) {
        // Only update if there are changes besides updatedAt
        await updateMeal(mealId, updates);
      }
    }

    // Delete user-meal participation record
    await deleteUserMealParticipation(auth.userId, mealId, participation.role);

    return successResponse({
      message: `Removed ${participation.role.toLowerCase()} signup successfully`,
      role: participation.role,
    });
  } catch (error) {
    console.error('Remove signup error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Authentication failed') || error.message.includes('No authentication token')) {
        return errorResponse(error.message, 401);
      }
      return errorResponse(error.message, 500);
    }

    return errorResponse('Internal server error', 500);
  }
}
