import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import {
  PublicProductsController,
  PublicGalleryController,
  PublicTestimonialsController,
  PublicContactController,
  PublicQuotesController,
  PublicFaqsController,
  AdminProductsController,
  AdminGalleryController,
  AdminTestimonialsController,
  AdminContactController,
  AdminQuotesController,
  AdminFaqsController,
} from './website.controller';
import { WebsiteService } from './website.service';
import { WebsiteRepository } from './website.repository';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [CacheModule.register(), UploadsModule],
  controllers: [
    PublicProductsController,
    PublicGalleryController,
    PublicTestimonialsController,
    PublicContactController,
    PublicQuotesController,
    PublicFaqsController,
    AdminProductsController,
    AdminGalleryController,
    AdminTestimonialsController,
    AdminContactController,
    AdminQuotesController,
    AdminFaqsController,
  ],
  providers: [WebsiteService, WebsiteRepository],
  exports: [WebsiteService],
})
export class WebsiteModule {}
