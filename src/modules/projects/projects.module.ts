import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectsRepository } from './projects.repository';
import { ProjectStatusService } from './project-status.service';
import { ProjectPaymentsService } from './project-payments.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { JobsModule } from '../../jobs/jobs.module';

@Module({
  imports: [NotificationsModule, InvoicesModule, JobsModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectsRepository, ProjectStatusService, ProjectPaymentsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
