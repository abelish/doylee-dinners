// DynamoDB entity types based on single-table design

/**
 * User entity stored in DynamoDB
 * PK: USER#{userId}
 * SK: PROFILE
 * GSI1PK: {email}
 * GSI1SK: USER#{userId}
 */
export interface User {
  PK: string; // USER#{userId}
  SK: string; // PROFILE
  userId: string;
  email: string;
  passwordHash: string;
  name: string;
  dietaryRestrictions?: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  GSI1PK: string; // email
  GSI1SK: string; // USER#{userId}
}

/**
 * User profile without sensitive data (for API responses)
 */
export interface UserProfile {
  userId: string;
  email: string;
  name: string;
  dietaryRestrictions?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Meal entity stored in DynamoDB
 * PK: MEAL#{mealId}
 * SK: METADATA
 * GSI2PK: MEAL#DATE#{date}
 * GSI2SK: {date}T{time}
 */
export interface Meal {
  PK: string; // MEAL#{mealId}
  SK: string; // METADATA
  mealId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  maxDiners: number;
  cookId?: string;
  cookName?: string;
  assistantId?: string;
  assistantName?: string;
  menu?: string;
  notes?: string;
  status: 'OPEN' | 'FULL' | 'CLOSED' | 'CANCELLED';
  createdBy: string; // userId of creator
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  GSI2PK: string; // MEAL#DATE#{date}
  GSI2SK: string; // {date}T{time}
}

/**
 * Meal signup (diner) entity
 * PK: MEAL#{mealId}
 * SK: DINER#{userId}
 */
export interface MealSignup {
  PK: string; // MEAL#{mealId}
  SK: string; // DINER#{userId}
  mealId: string;
  userId: string;
  userName: string;
  dietaryRestrictions?: string;
  signupTime: string; // ISO 8601
}

/**
 * User's meal participation index
 * PK: USER#{userId}
 * SK: MEAL#{mealId}#{role}
 */
export interface UserMealParticipation {
  PK: string; // USER#{userId}
  SK: string; // MEAL#{mealId}#{role}
  userId: string;
  mealId: string;
  mealDate: string; // YYYY-MM-DD
  mealTime: string; // HH:MM
  role: 'COOK' | 'ASSISTANT' | 'DINER';
}
