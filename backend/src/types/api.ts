// API request and response types

import { UserProfile } from './entities';

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

/**
 * Authentication request/response types
 */

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  dietaryRestrictions?: string;
}

export interface RegisterResponse {
  message: string;
  userId: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: UserProfile;
  token: string;
}

export interface AuthUser extends UserProfile {
  // Extended user info if needed
}

/**
 * JWT token payload
 */
export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number; // Issued at
  exp?: number; // Expiration
}

/**
 * Lambda event types
 */

export interface AuthenticatedEvent {
  userId: string;
  user?: UserProfile;
}
