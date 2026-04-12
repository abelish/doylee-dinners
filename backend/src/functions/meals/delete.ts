// Lambda function: Delete meal
// DELETE /meals/{mealId}

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { authenticateRequest } from '../../shared/auth/middleware';
import { getMealWithDiners, deleteMeal } from '../../shared/db/meals';
import { deleteAllParticipationForMeal } from '../../shared/db/signups';
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

    // Get meal with diners
    const { meal, diners } = await getMealWithDiners(mealId);

    if (!meal) {
      return errorResponse('Meal not found', 404);
    }

    // Check authorization - only creator can delete
    if (auth.userId !== meal.createdBy) {
      return errorResponse('Only the meal creator can delete this meal', 403);
    }

    // Collect all user IDs that need participation records deleted
    const userIds: string[] = [];

    // Add cook if exists
    if (meal.cookId) {
      userIds.push(meal.cookId);
    }

    // Add assistant if exists
    if (meal.assistantId) {
      userIds.push(meal.assistantId);
    }

    // Add all diners
    diners.forEach(diner => userIds.push(diner.userId));

    // Delete all user-meal participation records
    await deleteAllParticipationForMeal(mealId, userIds);

    // Delete meal and all signups
    await deleteMeal(mealId);

    return successResponse({
      message: 'Meal deleted successfully',
      mealId,
    });
  } catch (error) {
    console.error('Delete meal error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Authentication failed') || error.message.includes('No authentication token')) {
        return errorResponse(error.message, 401);
      }
      return errorResponse(error.message, 500);
    }

    return errorResponse('Internal server error', 500);
  }
}
