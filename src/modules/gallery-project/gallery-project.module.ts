import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { PublicGalleryProjectController, AdminGalleryProjectController } from './gallery-project.controller';
import { GalleryProjectService } from './gallery-project.service';
import { GalleryProjectRepository } from './gallery-project.repository';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [CacheModule.register(), UploadsModule],
  controllers: [PublicGalleryProjectController, AdminGalleryProjectController],
  providers: [GalleryProjectService, GalleryProjectRepository],
  exports: [GalleryProjectService],
})
export class GalleryProjectModule {}
