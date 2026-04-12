// Environment variable types

export interface Environment {
  TABLE_NAME: string;
  JWT_SECRET: string;
  AWS_REGION: string;
  CORS_ORIGIN: string;
  NODE_ENV?: 'development' | 'production' | 'test';
}

/**
 * Get environment variable or throw error if missing
 */
export function getEnvVar(key: keyof Environment): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Get all required environment variables
 */
export function getEnvironment(): Environment {
  return {
    TABLE_NAME: getEnvVar('TABLE_NAME'),
    JWT_SECRET: getEnvVar('JWT_SECRET'),
    AWS_REGION: getEnvVar('AWS_REGION'),
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
    NODE_ENV: (process.env.NODE_ENV as any) || 'production',
  };
}
