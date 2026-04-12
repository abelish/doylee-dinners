// Lambda function: User logout
// POST /auth/logout

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { clearCookieResponse, errorResponse } from '../../shared/utils/response';

export async function handler(_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Clear the token cookie
    return clearCookieResponse(
      {
        message: 'Logged out successfully',
      },
      'token'
    );
  } catch (error) {
    console.error('Logout error:', error);

    if (error instanceof Error) {
      return errorResponse(error.message, 500);
    }

    return errorResponse('Internal server error', 500);
  }
}
