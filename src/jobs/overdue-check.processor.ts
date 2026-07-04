import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database/drizzle.module';
import { eq, lt, and, gte } from 'drizzle-orm';
import { projects, users, payments, invoices } from '../database/schema';
import { NotificationsService } from '../modules/notifications/notifications.service';

@Injectable()
export class OverdueCheckProcessor {
  private readonly logger = new Logger(OverdueCheckProcessor.name);

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: any,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkOverdueProjects() {
    this.logger.log('Checking for overdue projects...');

    const today = new Date().toISOString().split('T')[0];

    const overdueProjects = await this.db
      .select({
        id: projects.id,
        title: projects.title,
        projectNumber: projects.projectNumber,
        deliveryDate: projects.deliveryDate,
        leadEmployeeId: projects.leadEmployeeId,
      })
      .from(projects)
      .where(
        and(
          lt(projects.deliveryDate, today),
          eq(projects.status, 'in_progress'),
        ),
      );

    for (const project of overdueProjects) {
      if (project.leadEmployeeId) {
        await this.notificationsService.notifyOverdueProject(
          project.leadEmployeeId,
          project.id,
          project.title,
          project.deliveryDate,
        );
      }
    }

    this.logger.log(`Found ${overdueProjects.length} overdue projects`);
    return { processed: overdueProjects.length };
  }
}
