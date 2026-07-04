import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
  HealthIndicatorResult,
  HealthIndicator,
} from '@nestjs/terminus';
import { Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database/drizzle.module';
import { sql } from 'drizzle-orm';

class DatabaseHealthIndicator extends HealthIndicator {
  constructor(private readonly db: any) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.db.execute(sql`SELECT 1`);
      return this.getStatus(key, true, { message: 'Database connected' });
    } catch (error) {
      return this.getStatus(key, false, { message: error.message });
    }
  }
}

@Controller('health')
export class HealthController {
  private dbHealthIndicator: DatabaseHealthIndicator;

  constructor(
    private health: HealthCheckService,
    @Inject(DATABASE_CONNECTION) private readonly db: any,
  ) {
    this.dbHealthIndicator = new DatabaseHealthIndicator(db);
  }

  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.dbHealthIndicator.isHealthy('database'),
    ]);
  }
}
