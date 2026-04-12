// Lambda function: Create meal
// POST /meals

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { authenticateRequest } from '../../shared/auth/middleware';
import { createMeal } from '../../shared/db/meals';
import { successResponse, errorResponse } from '../../shared/utils/response';
import { validateRequiredFields } from '../../shared/utils/validation';

interface CreateMealRequest {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  maxDiners: number;
  notes?: string;
}

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Authenticate request
    const auth = await authenticateRequest(event);

    // Parse request body
    if (!event.body) {
      return errorResponse('Request body is required', 400);
    }

    const body: CreateMealRequest = JSON.parse(event.body);

    // Validate required fields
    const validation = validateRequiredFields(body, ['date', 'time', 'maxDiners']);
    if (!validation.valid) {
      return errorResponse(`Missing required fields: ${validation.missing?.join(', ')}`, 400);
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(body.date)) {
      return errorResponse('Invalid date format. Use YYYY-MM-DD', 400);
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(body.time)) {
      return errorResponse('Invalid time format. Use HH:MM (24-hour)', 400);
    }

    // Validate date is not in the past
    const mealDateTime = new Date(`${body.date}T${body.time}:00Z`);
    const now = new Date();
    if (mealDateTime < now) {
      return errorResponse('Cannot create meal in the past', 400);
    }

    // Validate maxDiners
    if (body.maxDiners < 1 || body.maxDiners > 100) {
      return errorResponse('maxDiners must be between 1 and 100', 400);
    }

    // Validate notes length
    if (body.notes && body.notes.length > 1000) {
      return errorResponse('Notes cannot exceed 1000 characters', 400);
    }

    // Create meal
    const mealId = uuidv4();
    const now_iso = new Date().toISOString();

    const meal = await createMeal({
      mealId,
      date: body.date,
      time: body.time,
      maxDiners: body.maxDiners,
      notes: body.notes,
      status: 'OPEN',
      createdBy: auth.userId,
      createdAt: now_iso,
      updatedAt: now_iso,
    });

    return successResponse({
      meal: {
        mealId: meal.mealId,
        date: meal.date,
        time: meal.time,
        maxDiners: meal.maxDiners,
        notes: meal.notes,
        status: meal.status,
        createdBy: meal.createdBy,
        createdAt: meal.createdAt,
      },
    }, 201);
  } catch (error) {
    console.error('Create meal error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Authentication failed') || error.message.includes('No authentication token')) {
        return errorResponse(error.message, 401);
      }
      return errorResponse(error.message, 500);
    }

    return errorResponse('Internal server error', 500);
  }
}
