// Lambda function: Sign up for meal
// POST /meals/{mealId}/signup

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { authenticateRequest } from '../../shared/auth/middleware';
import { getMealById, updateMeal, countDiners } from '../../shared/db/meals';
import { createSignup, getSignup, createUserMealParticipation } from '../../shared/db/signups';
import { getUserById } from '../../shared/db/users';
import { successResponse, errorResponse } from '../../shared/utils/response';

interface SignupRequest {
  role: 'COOK' | 'ASSISTANT' | 'DINER';
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

    const body: SignupRequest = JSON.parse(event.body);

    // Validate role
    if (!['COOK', 'ASSISTANT', 'DINER'].includes(body.role)) {
      return errorResponse('Invalid role. Use COOK, ASSISTANT, or DINER', 400);
    }

    // Get meal
    const meal = await getMealById(mealId);
    if (!meal) {
      return errorResponse('Meal not found', 404);
    }

    // Check if meal is in the past
    const mealDateTime = new Date(`${meal.date}T${meal.time}:00Z`);
    if (mealDateTime < new Date()) {
      return errorResponse('Cannot sign up for past meal', 400);
    }

    // Check meal status based on role
    // Diners cannot sign up for closed meals, but cook/assistant can
    if (body.role === 'DINER' && meal.status !== 'OPEN') {
      return errorResponse(`Cannot sign up as diner for ${meal.status.toLowerCase()} meal`, 400);
    }

    // Cook and assistant can only sign up for OPEN or CLOSED meals
    if ((body.role === 'COOK' || body.role === 'ASSISTANT') && meal.status !== 'OPEN' && meal.status !== 'CLOSED') {
      return errorResponse(`Cannot sign up for ${meal.status.toLowerCase()} meal`, 400);
    }

    // Get user details
    const user = await getUserById(auth.userId);
    if (!user) {
      return errorResponse('User not found', 500);
    }

    // Handle different roles
    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (body.role === 'COOK') {
      // Check if cook position is taken
      if (meal.cookId) {
        return errorResponse('Cook position is already taken', 400);
      }

      // Check if user is already signed up as cook (duplicate check)
      if (meal.cookId === auth.userId) {
        return errorResponse('You are already signed up as cook', 400);
      }

      // Check if user is already a diner (not allowed to be both cook and diner)
      const existingDinerSignup = await getSignup(mealId, auth.userId);
      if (existingDinerSignup) {
        return errorResponse('Cannot sign up as cook - you are already signed up as a diner', 400);
      }

      updates.cookId = auth.userId;
      updates.cookName = user.name;

      // Update meal
      await updateMeal(mealId, updates);

      // Create user-meal participation record
      await createUserMealParticipation({
        userId: auth.userId,
        mealId,
        mealDate: meal.date,
        mealTime: meal.time,
        role: 'COOK',
      });

      return successResponse({
        message: 'Signed up as cook successfully',
        role: 'COOK',
      });
    } else if (body.role === 'ASSISTANT') {
      // Check if assistant position is taken
      if (meal.assistantId) {
        return errorResponse('Assistant position is already taken', 400);
      }

      // Check if user is already signed up as assistant (duplicate check)
      if (meal.assistantId === auth.userId) {
        return errorResponse('You are already signed up as assistant', 400);
      }

      // Check if user is already a diner (not allowed to be both assistant and diner)
      const existingDinerSignup = await getSignup(mealId, auth.userId);
      if (existingDinerSignup) {
        return errorResponse('Cannot sign up as assistant - you are already signed up as a diner', 400);
      }

      updates.assistantId = auth.userId;
      updates.assistantName = user.name;

      // Update meal
      await updateMeal(mealId, updates);

      // Create user-meal participation record
      await createUserMealParticipation({
        userId: auth.userId,
        mealId,
        mealDate: meal.date,
        mealTime: meal.time,
        role: 'ASSISTANT',
      });

      return successResponse({
        message: 'Signed up as assistant successfully',
        role: 'ASSISTANT',
      });
    } else {
      // DINER role
      // Check if user is already a diner (duplicate check)
      const existingDinerSignup = await getSignup(mealId, auth.userId);
      if (existingDinerSignup) {
        return errorResponse('You are already signed up as a diner', 400);
      }

      // Check if user is cook or assistant (not allowed to be diner + cook/assistant)
      if (meal.cookId === auth.userId || meal.assistantId === auth.userId) {
        return errorResponse('Cannot sign up as diner - you are already signed up as cook or assistant', 400);
      }

      // Check if meal is full
      const currentDinerCount = await countDiners(mealId);
      if (currentDinerCount >= meal.maxDiners) {
        return errorResponse('Meal is full', 400);
      }

      // Create signup
      await createSignup({
        mealId,
        userId: auth.userId,
        userName: user.name,
        dietaryRestrictions: user.dietaryRestrictions,
        signupTime: new Date().toISOString(),
      });

      // Create user-meal participation record
      await createUserMealParticipation({
        userId: auth.userId,
        mealId,
        mealDate: meal.date,
        mealTime: meal.time,
        role: 'DINER',
      });

      // Update meal status if now full
      const newDinerCount = currentDinerCount + 1;
      if (newDinerCount >= meal.maxDiners) {
        updates.status = 'FULL';
      }

      if (Object.keys(updates).length > 1) {
        // Only update if there are changes besides updatedAt
        await updateMeal(mealId, updates);
      }

      return successResponse({
        message: 'Signed up as diner successfully',
        role: 'DINER',
      });
    }
  } catch (error) {
    console.error('Signup error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Authentication failed') || error.message.includes('No authentication token')) {
        return errorResponse(error.message, 401);
      }
      return errorResponse(error.message, 500);
    }

    return errorResponse('Internal server error', 500);
  }
}
