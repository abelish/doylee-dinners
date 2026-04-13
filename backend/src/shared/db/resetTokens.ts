// Reset token database operations

import { PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ResetToken } from '../../types/resetToken';
import { getDynamoDBClient, getTableName } from './client';

/**
 * Store a password reset token in the database
 */
export async function storeResetToken(
  userId: string,
  email: string,
  tokenHash: string,
  expiresAt: number
): Promise<void> {
  const client = getDynamoDBClient();
  const tableName = getTableName();

  const now = new Date().toISOString();
  const resetToken: ResetToken = {
    PK: `RESET#${tokenHash}`,
    SK: `USER#${userId}`,
    userId,
    email: email.toLowerCase(),
    tokenHash,
    used: false,
    expiresAt,
    createdAt: now,
  };

  await client.send(
    new PutCommand({
      TableName: tableName,
      Item: resetToken,
    })
  );
}

/**
 * Get a reset token by its hash
 */
export async function getResetToken(tokenHash: string): Promise<ResetToken | null> {
  const client = getDynamoDBClient();
  const tableName = getTableName();

  // Query by PK to find the reset token
  const result = await client.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `RESET#${tokenHash}`,
      },
      Limit: 1,
    })
  );

  return result.Items && result.Items.length > 0 ? (result.Items[0] as ResetToken) : null;
}

/**
 * Mark a reset token as used (atomic update to prevent race conditions)
 */
export async function markTokenUsed(tokenHash: string, userId: string): Promise<void> {
  const client = getDynamoDBClient();
  const tableName = getTableName();

  await client.send(
    new UpdateCommand({
      TableName: tableName,
      Key: {
        PK: `RESET#${tokenHash}`,
        SK: `USER#${userId}`,
      },
      UpdateExpression: 'SET #used = :true',
      ExpressionAttributeNames: {
        '#used': 'used',
      },
      ExpressionAttributeValues: {
        ':true': true,
        ':false': false,
      },
      ConditionExpression: '#used = :false', // Only update if not already used
    })
  );
}

/**
 * Delete all expired/used reset tokens for a user
 * Called before creating a new token to clean up old ones
 * Note: We rely primarily on DynamoDB TTL for automatic cleanup
 * This function is here for immediate cleanup if needed in the future
 */
export async function deleteExpiredTokens(userId: string): Promise<void> {
  // For now, we rely on DynamoDB TTL to automatically delete expired tokens
  // This keeps the implementation simple and cost-effective
  // If needed in the future, we can add a GSI to query all tokens for a user
  console.log(`TTL will automatically clean up expired tokens for user ${userId}`);
}
