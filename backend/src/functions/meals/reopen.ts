// Lambda function: Reopen meal signups
// PUT /meals/{mealId}/reopen

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { authenticateRequest } from '../../shared/auth/middleware';
import { getMealById, updateMeal } from '../../shared/db/meals';
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

    // Get the meal
    const meal = await getMealById(mealId);
    if (!meal) {
      return errorResponse('Meal not found', 404);
    }

    // Only the cook can reopen signups
    if (meal.cookId !== auth.userId) {
      return errorResponse('Only the cook can reopen signups', 403);
    }

    // Check if meal is closed
    if (meal.status !== 'CLOSED') {
      return errorResponse('Meal is not closed', 400);
    }

    // Reopen the meal
    const updatedMeal = await updateMeal(mealId, { status: 'OPEN' });

    return successResponse({
      meal: updatedMeal,
      message: 'Meal signups reopened successfully',
    });
  } catch (error) {
    console.error('Reopen meal error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Authentication failed') || error.message.includes('No authentication token')) {
        return errorResponse(error.message, 401);
      }
      return errorResponse(error.message, 500);
    }

    return errorResponse('Internal server error', 500);
  }
}
