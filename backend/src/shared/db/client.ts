// DynamoDB client wrapper

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { getEnvVar } from '../../types/environment';

/**
 * Create DynamoDB Document Client
 */
export function createDynamoDBClient(): DynamoDBDocumentClient {
  const region = getEnvVar('AWS_REGION');

  // Configure for LocalStack if endpoint is provided
  const endpoint = process.env.AWS_ENDPOINT;

  const client = new DynamoDBClient({
    region,
    ...(endpoint && { endpoint }),
  });

  return DynamoDBDocumentClient.from(client, {
    marshallOptions: {
      removeUndefinedValues: true,
      convertEmptyValues: false,
    },
  });
}

/**
 * Singleton DynamoDB client instance
 */
let dynamoDBClient: DynamoDBDocumentClient | null = null;

export function getDynamoDBClient(): DynamoDBDocumentClient {
  if (!dynamoDBClient) {
    dynamoDBClient = createDynamoDBClient();
  }
  return dynamoDBClient;
}

/**
 * Get table name from environment
 */
export function getTableName(): string {
  return getEnvVar('TABLE_NAME');
}
