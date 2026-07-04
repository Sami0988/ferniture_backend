import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../database/drizzle.module';
import { auditLogs } from '../../database/schema';

const AUDIT_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user } = request;

    if (!AUDIT_METHODS.includes(method)) {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap(async (response) => {
        const duration = Date.now() - startTime;

        try {
          const entityType = this.extractEntityType(url);
          const entityId = this.extractEntityId(url, response);
          const action = this.buildAction(method, url);

          if (entityType) {
            await this.db.insert(auditLogs).values({
              userId: user?.id || null,
              action,
              entityType,
              entityId: entityId || null,
              metadata: {
                method,
                url,
                statusCode: context.switchToHttp().getResponse().statusCode,
                duration,
                body: this.sanitizeBody(body),
              },
            });
          }
        } catch (error) {
          this.logger.error(`Audit log failed: ${error.message}`);
        }
      }),
    );
  }

  private extractEntityType(url: string): string | null {
    const segments = url.split('/').filter(Boolean);
    // /api/projects/:id -> projects
    // /api/projects/:id/status -> projects
    // /api/invoices/:id/payments -> invoices
    if (segments.length >= 2) {
      return segments[1]; // Skip 'api' prefix
    }
    return null;
  }

  private extractEntityId(url: string, response: any): string | null {
    // Try to extract ID from URL
    const segments = url.split('/').filter(Boolean);
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    for (const segment of segments) {
      if (uuidRegex.test(segment)) {
        return segment;
      }
    }

    // Try to extract from response
    if (response?.id) return response.id;
    if (response?.data?.id) return response.data.id;

    return null;
  }

  private buildAction(method: string, url: string): string {
    const segments = url.split('/').filter(Boolean);
    const entity = segments[1] || 'unknown';

    const actionMap: Record<string, string> = {
      POST: `${entity}.created`,
      PUT: `${entity}.updated`,
      PATCH: `${entity}.updated`,
      DELETE: `${entity}.deleted`,
    };

    return actionMap[method] || `${entity}.action`;
  }

  private sanitizeBody(body: any): any {
    if (!body) return null;

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'passwordHash', 'token', 'secret'];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
