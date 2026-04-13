// User database operations

import { GetCommand, PutCommand, QueryCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { User, UserProfile } from '../../types/entities';
import { getDynamoDBClient, getTableName } from './client';

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const client = getDynamoDBClient();
  const tableName = getTableName();

  const result = await client.send(
    new GetCommand({
      TableName: tableName,
      Key: {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
      },
    })
  );

  return (result.Item as User) || null;
}

/**
 * Get user by email (uses GSI1)
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const client = getDynamoDBClient();
  const tableName = getTableName();

  const result = await client.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :email',
      ExpressionAttributeValues: {
        ':email': email.toLowerCase(),
      },
      Limit: 1,
    })
  );

  return result.Items && result.Items.length > 0 ? (result.Items[0] as User) : null;
}

/**
 * Create a new user
 */
export async function createUser(
  userId: string,
  email: string,
  passwordHash: string,
  name: string,
  dietaryRestrictions?: string
): Promise<User> {
  const client = getDynamoDBClient();
  const tableName = getTableName();

  const now = new Date().toISOString();
  const user: User = {
    PK: `USER#${userId}`,
    SK: 'PROFILE',
    userId,
    email: email.toLowerCase(),
    passwordHash,
    name,
    dietaryRestrictions,
    createdAt: now,
    updatedAt: now,
    GSI1PK: email.toLowerCase(),
    GSI1SK: `USER#${userId}`,
  };

  await client.send(
    new PutCommand({
      TableName: tableName,
      Item: user,
      ConditionExpression: 'attribute_not_exists(PK)',
    })
  );

  return user;
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    name?: string;
    dietaryRestrictions?: string;
  }
): Promise<User> {
  const client = getDynamoDBClient();
  const tableName = getTableName();

  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  if (updates.name !== undefined) {
    updateExpressions.push('#name = :name');
    expressionAttributeNames['#name'] = 'name';
    expressionAttributeValues[':name'] = updates.name;
  }

  if (updates.dietaryRestrictions !== undefined) {
    updateExpressions.push('#dr = :dr');
    expressionAttributeNames['#dr'] = 'dietaryRestrictions';
    expressionAttributeValues[':dr'] = updates.dietaryRestrictions;
  }

  // Always update updatedAt
  updateExpressions.push('#updatedAt = :updatedAt');
  expressionAttributeNames['#updatedAt'] = 'updatedAt';
  expressionAttributeValues[':updatedAt'] = new Date().toISOString();

  const result = await client.send(
    new UpdateCommand({
      TableName: tableName,
      Key: {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    })
  );

  return result.Attributes as User;
}

/**
 * Update user password
 */
export async function updateUserPassword(userId: string, newPasswordHash: string): Promise<void> {
  const client = getDynamoDBClient();
  const tableName = getTableName();

  await client.send(
    new UpdateCommand({
      TableName: tableName,
      Key: {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
      },
      UpdateExpression: 'SET #passwordHash = :passwordHash, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#passwordHash': 'passwordHash',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':passwordHash': newPasswordHash,
        ':updatedAt': new Date().toISOString(),
      },
    })
  );
}

/**
 * Get all registered users
 * Uses DynamoDB Scan - acceptable for small user base
 */
export async function getAllUsers(): Promise<User[]> {
  const client = getDynamoDBClient();
  const tableName = getTableName();

  const result = await client.send(
    new ScanCommand({
      TableName: tableName,
      FilterExpression: 'begins_with(PK, :pk) AND SK = :sk',
      ExpressionAttributeValues: {
        ':pk': 'USER#',
        ':sk': 'PROFILE',
      },
    })
  );

  return (result.Items || []) as User[];
}

/**
 * Convert User to UserProfile (remove sensitive data)
 */
export function userToProfile(user: User): UserProfile {
  return {
    userId: user.userId,
    email: user.email,
    name: user.name,
    dietaryRestrictions: user.dietaryRestrictions,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
