import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import {
  PublicProjectsToSellController,
  AdminProjectsToSellController,
} from './projects-to-sell.controller';
import { ProjectsToSellService } from './projects-to-sell.service';
import { ProjectsToSellRepository } from './projects-to-sell.repository';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [CacheModule.register(), UploadsModule],
  controllers: [PublicProjectsToSellController, AdminProjectsToSellController],
  providers: [ProjectsToSellService, ProjectsToSellRepository],
  exports: [ProjectsToSellService],
})
export class ProjectsToSellModule {}
