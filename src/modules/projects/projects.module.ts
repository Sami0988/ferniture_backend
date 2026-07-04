import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectsRepository } from './projects.repository';
import { ProjectStatusService } from './project-status.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { JobsModule } from '../../jobs/jobs.module';

@Module({
  imports: [NotificationsModule, JobsModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectsRepository, ProjectStatusService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
