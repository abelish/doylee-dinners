// Reset token types

export interface ResetToken {
  PK: string; // RESET#{tokenHash}
  SK: string; // USER#{userId}
  userId: string;
  email: string;
  tokenHash: string;
  used: boolean;
  expiresAt: number; // Unix timestamp for TTL
  createdAt: string; // ISO 8601
}
