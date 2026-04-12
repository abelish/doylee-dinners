// Lambda function: Close meal signups
// PUT /meals/{mealId}/close

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

    // Only the cook can close signups
    if (meal.cookId !== auth.userId) {
      return errorResponse('Only the cook can close signups', 403);
    }

    // Check if meal is already closed
    if (meal.status === 'CLOSED') {
      return errorResponse('Meal is already closed', 400);
    }

    // Close the meal
    const updatedMeal = await updateMeal(mealId, { status: 'CLOSED' });

    return successResponse({
      meal: updatedMeal,
      message: 'Meal signups closed successfully',
    });
  } catch (error) {
    console.error('Close meal error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Authentication failed') || error.message.includes('No authentication token')) {
        return errorResponse(error.message, 401);
      }
      return errorResponse(error.message, 500);
    }

    return errorResponse('Internal server error', 500);
  }
}
