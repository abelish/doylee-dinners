// Lambda function: List meals
// GET /meals?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&status=OPEN

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { authenticateRequest } from '../../shared/auth/middleware';
import { listMealsByDateRange, countDiners } from '../../shared/db/meals';
import { successResponse, errorResponse } from '../../shared/utils/response';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Authenticate request
    await authenticateRequest(event);

    // Get query parameters
    const queryParams = event.queryStringParameters || {};
    const startDate = queryParams.startDate;
    const endDate = queryParams.endDate;
    const statusFilter = queryParams.status?.toUpperCase();

    // If no date range provided, default to next 30 days
    const now = new Date();
    const defaultStartDate = now.toISOString().split('T')[0];
    const defaultEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const finalStartDate = startDate || defaultStartDate;
    const finalEndDate = endDate || defaultEndDate;

    // Validate date formats
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(finalStartDate) || !dateRegex.test(finalEndDate)) {
      return errorResponse('Invalid date format. Use YYYY-MM-DD', 400);
    }

    // Validate status filter if provided
    if (statusFilter && !['OPEN', 'FULL', 'CLOSED', 'CANCELLED'].includes(statusFilter)) {
      return errorResponse('Invalid status. Use OPEN, FULL, CLOSED, or CANCELLED', 400);
    }

    // Get meals
    let meals = await listMealsByDateRange(finalStartDate, finalEndDate);

    // Filter by status if provided
    if (statusFilter) {
      meals = meals.filter(meal => meal.status === statusFilter);
    }

    // Get diner counts for each meal
    const mealsWithCounts = await Promise.all(
      meals.map(async (meal) => {
        const dinerCount = await countDiners(meal.mealId);
        const spotsAvailable = meal.maxDiners - dinerCount;

        return {
          mealId: meal.mealId,
          date: meal.date,
          time: meal.time,
          maxDiners: meal.maxDiners,
          currentDiners: dinerCount,
          spotsAvailable,
          cookId: meal.cookId,
          cookName: meal.cookName,
          assistantId: meal.assistantId,
          assistantName: meal.assistantName,
          hasMenu: !!meal.menu,
          notes: meal.notes,
          status: meal.status,
          createdBy: meal.createdBy,
          createdAt: meal.createdAt,
        };
      })
    );

    // Sort by date and time
    mealsWithCounts.sort((a, b) => {
      const aDateTime = `${a.date}T${a.time}`;
      const bDateTime = `${b.date}T${b.time}`;
      return aDateTime.localeCompare(bDateTime);
    });

    return successResponse({
      meals: mealsWithCounts,
      count: mealsWithCounts.length,
    });
  } catch (error) {
    console.error('List meals error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Authentication failed') || error.message.includes('No authentication token')) {
        return errorResponse(error.message, 401);
      }
      return errorResponse(error.message, 500);
    }

    return errorResponse('Internal server error', 500);
  }
}
