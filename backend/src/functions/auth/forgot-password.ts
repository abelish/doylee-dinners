// Lambda function: Request password reset
// POST /auth/forgot-password

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getUserByEmail } from '../../shared/db/users';
import { generateResetToken, hashResetToken } from '../../shared/auth/resetToken';
import { storeResetToken } from '../../shared/db/resetTokens';
import { sendPasswordResetEmail } from '../../shared/email/ses';
import { successResponse, errorResponse } from '../../shared/utils/response';
import { isValidEmail } from '../../shared/utils/validation';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const startTime = Date.now();

  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { email } = body;

    // Validate email format
    if (!email || typeof email !== 'string') {
      return errorResponse('Email is required', 400);
    }

    if (!isValidEmail(email)) {
      return errorResponse('Invalid email format', 400);
    }

    // Look up user by email
    const user = await getUserByEmail(email);

    // If user exists, send reset email
    if (user) {
      try {
        // Generate reset token
        const resetToken = generateResetToken();
        const tokenHash = hashResetToken(resetToken);

        // Calculate expiration (1 hour from now)
        const expiresAt = Math.floor(Date.now() / 1000) + 3600; // Unix timestamp

        // Store token in database
        await storeResetToken(user.userId, user.email, tokenHash, expiresAt);

        // Send reset email
        await sendPasswordResetEmail(user.email, resetToken, user.name);

        console.log(`Password reset requested for user ${user.userId}`);
      } catch (error) {
        console.error('Error processing password reset:', error);
        // Don't reveal the error to the user for security
      }
    }

    // Add artificial delay to prevent timing attacks (total ~500ms)
    const elapsed = Date.now() - startTime;
    const targetDelay = 500;
    if (elapsed < targetDelay) {
      await new Promise(resolve => setTimeout(resolve, targetDelay - elapsed));
    }

    // Always return success (don't reveal if email exists)
    return successResponse({
      message: 'If an account exists with that email, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return errorResponse('An error occurred processing your request', 500);
  }
}
