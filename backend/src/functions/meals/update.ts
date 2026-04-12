// Lambda function: Update meal
// PUT /meals/{mealId}

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { authenticateRequest } from '../../shared/auth/middleware';
import { getMealById, updateMeal, countDiners } from '../../shared/db/meals';
import { successResponse, errorResponse } from '../../shared/utils/response';

interface UpdateMealRequest {
  menu?: string;
  notes?: string;
  maxDiners?: number;
}

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Authenticate request
    const auth = await authenticateRequest(event);

    // Get mealId from path parameters
    const mealId = event.pathParameters?.mealId;
    if (!mealId) {
      return errorResponse('mealId is required', 400);
    }

    // Parse request body
    if (!event.body) {
      return errorResponse('Request body is required', 400);
    }

    const body: UpdateMealRequest = JSON.parse(event.body);

    // Get existing meal
    const meal = await getMealById(mealId);
    if (!meal) {
      return errorResponse('Meal not found', 404);
    }

    // Check authorization
    const isCreator = auth.userId === meal.createdBy;
    const isCook = auth.userId === meal.cookId;

    if (!isCreator && !isCook) {
      return errorResponse('You do not have permission to update this meal', 403);
    }

    // Creator can update everything
    // Cook can only update menu and notes
    if (!isCreator && isCook) {
      if (body.maxDiners !== undefined) {
        return errorResponse('Only the meal creator can update maxDiners', 403);
      }
    }

    // Validate updates
    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (body.menu !== undefined) {
      if (body.menu.length > 2000) {
        return errorResponse('Menu cannot exceed 2000 characters', 400);
      }
      updates.menu = body.menu;
    }

    if (body.notes !== undefined) {
      if (body.notes.length > 1000) {
        return errorResponse('Notes cannot exceed 1000 characters', 400);
      }
      updates.notes = body.notes;
    }

    if (body.maxDiners !== undefined) {
      if (body.maxDiners < 1 || body.maxDiners > 100) {
        return errorResponse('maxDiners must be between 1 and 100', 400);
      }

      // Check if reducing maxDiners below current diner count
      const currentDinerCount = await countDiners(mealId);
      if (body.maxDiners < currentDinerCount) {
        return errorResponse(
          `Cannot reduce maxDiners to ${body.maxDiners}. There are already ${currentDinerCount} diners signed up.`,
          400
        );
      }

      updates.maxDiners = body.maxDiners;

      // Update status based on new maxDiners
      if (body.maxDiners === currentDinerCount) {
        updates.status = 'FULL';
      } else if (meal.status === 'FULL') {
        updates.status = 'OPEN';
      }
    }

    // Update meal
    const updatedMeal = await updateMeal(mealId, updates);

    return successResponse({
      meal: {
        mealId: updatedMeal.mealId,
        date: updatedMeal.date,
        time: updatedMeal.time,
        maxDiners: updatedMeal.maxDiners,
        cookId: updatedMeal.cookId,
        cookName: updatedMeal.cookName,
        assistantId: updatedMeal.assistantId,
        assistantName: updatedMeal.assistantName,
        menu: updatedMeal.menu,
        notes: updatedMeal.notes,
        status: updatedMeal.status,
        createdBy: updatedMeal.createdBy,
        createdAt: updatedMeal.createdAt,
        updatedAt: updatedMeal.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update meal error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Authentication failed') || error.message.includes('No authentication token')) {
        return errorResponse(error.message, 401);
      }
      return errorResponse(error.message, 500);
    }

    return errorResponse('Internal server error', 500);
  }
}
