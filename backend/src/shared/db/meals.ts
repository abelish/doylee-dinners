// DynamoDB operations for meals

import { PutCommand, GetCommand, UpdateCommand, QueryCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { getDynamoDBClient, getTableName } from './client';
import { Meal, MealSignup } from '../../types/entities';

/**
 * Create a new meal
 */
export async function createMeal(meal: Omit<Meal, 'PK' | 'SK' | 'GSI2PK' | 'GSI2SK'>): Promise<Meal> {
  const client = getDynamoDBClient();
  const tableName = getTableName();

  const mealItem: Meal = {
    ...meal,
    PK: `MEAL#${meal.mealId}`,
    SK: 'METADATA',
    GSI2PK: 'MEAL',
    GSI2SK: `${meal.date}#${meal.time}`,
  };

  await client.send(
    new PutCommand({
      TableName: tableName,
      Item: mealItem,
    })
  );

  return mealItem;
}

/**
 * Get meal by ID
 */
export async function getMealById(mealId: string): Promise<Meal | null> {
  const client = getDynamoDBClient();
  const tableName = getTableName();

  const result = await client.send(
    new GetCommand({
      TableName: tableName,
      Key: {
        PK: `MEAL#${mealId}`,
        SK: 'METADATA',
      },
    })
  );

  return (result.Item as Meal) || null;
}

/**
 * Update a meal
 */
export async function updateMeal(
  mealId: string,
  updates: Partial<Pick<Meal, 'menu' | 'status' | 'maxDiners' | 'cookId' | 'cookName' | 'assistantId' | 'assistantName' | 'updatedAt'>>
): Promise<Meal> {
  const client = getDynamoDBClient();
  const tableName = getTableName();

  // Build update expression
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  Object.entries(updates).forEach(([key, value]) => {
    updateExpressions.push(`#${key} = :${key}`);
    expressionAttributeNames[`#${key}`] = key;
    expressionAttributeValues[`:${key}`] = value;
  });

  const result = await client.send(
    new UpdateCommand({
      TableName: tableName,
      Key: {
        PK: `MEAL#${mealId}`,
        SK: 'METADATA',
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    })
  );

  return result.Attributes as Meal;
}

/**
 * Delete a meal and all its signups
 */
export async function deleteMeal(mealId: string): Promise<void> {
  const client = getDynamoDBClient();
  const tableName = getTableName();

  // First, get all items for this meal (METADATA + all DINERs)
  const queryResult = await client.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `MEAL#${mealId}`,
      },
    })
  );

  if (!queryResult.Items || queryResult.Items.length === 0) {
    return;
  }

  // Delete all items in batches (max 25 per batch)
  const items = queryResult.Items;
  const batches: any[][] = [];
  for (let i = 0; i < items.length; i += 25) {
    batches.push(items.slice(i, i + 25));
  }

  for (const batch of batches) {
    const deleteRequests = batch.map(item => ({
      DeleteRequest: {
        Key: {
          PK: item.PK,
          SK: item.SK,
        },
      },
    }));

    await client.send(
      new BatchWriteCommand({
        RequestItems: {
          [tableName]: deleteRequests,
        },
      })
    );
  }
}

/**
 * List meals by date range
 */
export async function listMealsByDateRange(startDate: string, endDate: string): Promise<Meal[]> {
  const client = getDynamoDBClient();
  const tableName = getTableName();

  const result = await client.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :pk AND GSI2SK BETWEEN :startDate AND :endDate',
      ExpressionAttributeValues: {
        ':pk': 'MEAL',
        ':startDate': `${startDate}#00:00`,
        ':endDate': `${endDate}#23:59`,
      },
    })
  );

  return (result.Items as Meal[]) || [];
}

/**
 * Get meal with all diners
 */
export async function getMealWithDiners(mealId: string): Promise<{
  meal: Meal | null;
  diners: MealSignup[];
}> {
  const client = getDynamoDBClient();
  const tableName = getTableName();

  const result = await client.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `MEAL#${mealId}`,
      },
    })
  );

  if (!result.Items || result.Items.length === 0) {
    return { meal: null, diners: [] };
  }

  const meal = result.Items.find(item => item.SK === 'METADATA') as Meal | undefined;
  const diners = result.Items.filter(item => item.SK.startsWith('DINER#')) as MealSignup[];

  return {
    meal: meal || null,
    diners,
  };
}

/**
 * Count diners for a meal
 */
export async function countDiners(mealId: string): Promise<number> {
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
      Select: 'COUNT',
    })
  );

  return result.Count || 0;
}
