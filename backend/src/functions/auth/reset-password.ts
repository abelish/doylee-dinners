// Lambda function: Reset password with token
// POST /auth/reset-password

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getUserById } from '../../shared/db/users';
import { updateUserPassword } from '../../shared/db/users';
import { validateResetTokenFormat, hashResetToken } from '../../shared/auth/resetToken';
import { getResetToken, markTokenUsed } from '../../shared/db/resetTokens';
import { hashPassword, validatePassword } from '../../shared/auth/password';
import { generateToken } from '../../shared/auth/jwt';
import { successResponse, errorResponse } from '../../shared/utils/response';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { token, newPassword } = body;

    // Validate required fields
    if (!token || typeof token !== 'string') {
      return errorResponse('Reset token is required', 400);
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return errorResponse('New password is required', 400);
    }

    // Validate token format
    if (!validateResetTokenFormat(token)) {
      return errorResponse('Invalid or expired reset token', 404);
    }

    // Validate password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return errorResponse(
        passwordValidation.message || 'Password does not meet requirements',
        400
      );
    }

    // Hash token and look it up in database
    const tokenHash = hashResetToken(token);
    const resetToken = await getResetToken(tokenHash);

    if (!resetToken) {
      return errorResponse('Invalid or expired reset token', 404);
    }

    // Check if token has expired
    const now = Math.floor(Date.now() / 1000);
    if (resetToken.expiresAt < now) {
      return errorResponse('Reset token has expired', 404);
    }

    // Check if token has been used
    if (resetToken.used) {
      return errorResponse('Reset token has already been used', 404);
    }

    // Mark token as used (atomic update)
    try {
      await markTokenUsed(tokenHash, resetToken.userId);
    } catch (error) {
      // If update fails due to condition (already used), return error
      console.error('Token already used:', error);
      return errorResponse('Reset token has already been used', 404);
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update user password
    await updateUserPassword(resetToken.userId, newPasswordHash);

    // Get updated user for JWT
    const user = await getUserById(resetToken.userId);
    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Generate JWT token for auto-login
    const jwtToken = generateToken(user.userId, user.email);

    console.log(`Password reset successful for user ${user.userId}`);

    // Return success with JWT token
    const response = {
      message: 'Password reset successful',
      token: jwtToken,
      user: {
        userId: user.userId,
        email: user.email,
        name: user.name,
        dietaryRestrictions: user.dietaryRestrictions,
      },
    };

    const headers = {
      'Set-Cookie': `token=${jwtToken}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=604800`,
    };

    return successResponse(response, 200, headers);
  } catch (error) {
    console.error('Reset password error:', error);

    if (error instanceof Error) {
      return errorResponse(error.message, 500);
    }

    return errorResponse('An error occurred resetting your password', 500);
  }
}
