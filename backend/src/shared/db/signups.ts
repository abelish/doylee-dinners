// DynamoDB operations for meal signups

import { PutCommand, GetCommand, DeleteCommand, QueryCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { getDynamoDBClient, getTableName } from './client';
import { MealSignup, UserMealParticipation } from '../../types/entities';

/**
 * Create a signup for a meal
 */
export async function createSignup(signup: Omit<MealSignup, 'PK' | 'SK'>): Promise<MealSignup> {
  const client = getDynamoDBClient();
  const tableName = getTableName();

  const signupItem: MealSignup = {
    ...signup,
    PK: `MEAL#${signup.mealId}`,
    SK: `DINER#${signup.userId}`,
  };

  await client.send(
    new PutCommand({
      TableName: tableName,
      Item: signupItem,
    })
  );

  return signupItem;
}

/**
 * Get a specific signup
 */
export async function getSignup(mealId: string, userId: string): Promise<MealSignup | null> {
  const client = getDynamoDBClient();
  const tableName = getTableName();

  const result = await client.send(
    new GetCommand({
      TableName: tableName,
      Key: {
        PK: `MEAL#${mealId}`,
        SK: `DINER#${userId}`,
      },
    })
  );

  return (result.Item as MealSignup) || null;
}

/**
 * Delete a signup
 */
export async function deleteSignup(mealId: string, userId: string): Promise<void> {
  const client = getDynamoDBClient();
  const tableName = getTableName();

  await client.send(
    new DeleteCommand({
      TableName: tableName,
      Key: {
        PK: `MEAL#${mealId}`,
        SK: `DINER#${userId}`,
      },
    })
  );
}

/**
 * List all diners for a meal
 */
export async function listDinersForMeal(mealId: string): Promise<MealSignup[]> {
  const client = getDynamoDBClient();
  const tableName = getTableName();

  const result = await client.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': `MEAL#${mealId}`,
        ':skPrefix': 'DINER#',
      },
    })
  );

  return (result.Items as MealSignup[]) || [];
}

/**
 * Create user-meal participation index entry
 */
export async function createUserMealParticipation(
  participation: Omit<UserMealParticipation, 'PK' | 'SK'>
): Promise<UserMealParticipation> {
  const client = getDynamoDBClient();
  const tableName = getTableName();

  const participationItem: UserMealParticipation = {
    ...participation,
    PK: `USER#${participation.userId}`,
    SK: `MEAL#${participation.mealId}#${participation.role}`,
  };

  await client.send(
    new PutCommand({
      TableName: tableName,
      Item: participationItem,
    })
  );

  return participationItem;
}

/**
 * Delete user-meal participation index entry
 */
export async function deleteUserMealParticipation(
  userId: string,
  mealId: string,
  role: 'COOK' | 'ASSISTANT' | 'DINER'
): Promise<void> {
  const client = getDynamoDBClient();
  const tableName = getTableName();

  await client.send(
    new DeleteCommand({
      TableName: tableName,
      Key: {
        PK: `USER#${userId}`,
        SK: `MEAL#${mealId}#${role}`,
      },
    })
  );
}

/**
 * Get user's meal participation
 */
export async function getUserMealParticipation(
  userId: string,
  mealId: string
): Promise<UserMealParticipation | null> {
  const client = getDynamoDBClient();
  const tableName = getTableName();

  // Query for all participation records for this user and meal
  const result = await client.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':skPrefix': `MEAL#${mealId}#`,
      },
    })
  );

  if (!result.Items || result.Items.length === 0) {
    return null;
  }

  // Return the first match (user should only have one role per meal)
  return result.Items[0] as UserMealParticipation;
}

/**
 * List all meals a user is participating in
 */
export async function listUserMeals(userId: string): Promise<UserMealParticipation[]> {
  const client = getDynamoDBClient();
  const tableName = getTableName();

  const result = await client.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':skPrefix': 'MEAL#',
      },
    })
  );

  return (result.Items as UserMealParticipation[]) || [];
}

/**
 * Delete all user-meal participation records for a meal
 * (used when deleting a meal)
 */
export async function deleteAllParticipationForMeal(
  mealId: string,
  userIds: string[]
): Promise<void> {
  if (userIds.length === 0) return;

  const client = getDynamoDBClient();
  const tableName = getTableName();

  // Build delete requests for all roles
  const deleteRequests: any[] = [];
  const roles: Array<'COOK' | 'ASSISTANT' | 'DINER'> = ['COOK', 'ASSISTANT', 'DINER'];

  for (const userId of userIds) {
    for (const role of roles) {
      deleteRequests.push({
        DeleteRequest: {
          Key: {
            PK: `USER#${userId}`,
            SK: `MEAL#${mealId}#${role}`,
          },
        },
      });
    }
  }

  // Delete in batches of 25
  const batches: any[][] = [];
  for (let i = 0; i < deleteRequests.length; i += 25) {
    batches.push(deleteRequests.slice(i, i + 25));
  }

  for (const batch of batches) {
    await client.send(
      new BatchWriteCommand({
        RequestItems: {
          [tableName]: batch,
        },
      })
    );
  }
}
