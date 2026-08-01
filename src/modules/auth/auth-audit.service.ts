import { Injectable, Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../database/drizzle.module';
import { authAuditLog } from '../../database/schema';

export type AuthEvent =
  | 'login_success'
  | 'login_fail'
  | 'account_locked'
  | 'logout'
  | 'password_reset'
  | 'refresh_token_reuse_detected'
  | 'mfa_setup'
  | 'mfa_confirm'
  | 'mfa_fail'
  | 'mfa_success'
  | 'mfa_disable';

@Injectable()
export class AuthAuditService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: any,
  ) {}

  async log(params: {
    userId?: string;
    event: AuthEvent;
    ip?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      await this.db.insert(authAuditLog).values({
        userId: params.userId || null,
        event: params.event,
        ip: params.ip || null,
        userAgent: params.userAgent || null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      });
    } catch (error) {
      // Don't let audit logging failures break the auth flow
      console.error('Failed to write auth audit log:', error);
    }
  }
}
