// Lambda function: Get meal details
// GET /meals/{mealId}

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { authenticateRequest } from '../../shared/auth/middleware';
import { getMealWithDiners } from '../../shared/db/meals';
import { getUserById } from '../../shared/db/users';
import { successResponse, errorResponse } from '../../shared/utils/response';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Authenticate request
    await authenticateRequest(event);

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

    // Get creator's name
    let createdByName: string | undefined;
    if (meal.createdBy) {
      const creator = await getUserById(meal.createdBy);
      createdByName = creator?.name;
    }

    // Format diner list - dietary restrictions visible to all
    const formattedDiners = diners.map(diner => ({
      userId: diner.userId,
      name: diner.userName,
      dietaryRestrictions: diner.dietaryRestrictions,
      signupTime: diner.signupTime,
    }));

    // Calculate spots available
    const spotsAvailable = meal.maxDiners - diners.length;

    return successResponse({
      meal: {
        mealId: meal.mealId,
        date: meal.date,
        time: meal.time,
        maxDiners: meal.maxDiners,
        currentDiners: diners.length,
        spotsAvailable,
        cookId: meal.cookId,
        cookName: meal.cookName,
        assistantId: meal.assistantId,
        assistantName: meal.assistantName,
        menu: meal.menu,
        notes: meal.notes,
        status: meal.status,
        createdBy: meal.createdBy,
        createdByName: createdByName,
        createdAt: meal.createdAt,
        updatedAt: meal.updatedAt,
        diners: formattedDiners,
      },
    });
  } catch (error) {
    console.error('Get meal error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Authentication failed') || error.message.includes('No authentication token')) {
        return errorResponse(error.message, 401);
      }
      return errorResponse(error.message, 500);
    }

    return errorResponse('Internal server error', 500);
  }
}
