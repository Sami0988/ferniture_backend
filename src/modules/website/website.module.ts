import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import {
  PublicProductsController,
  PublicGalleryController,
  PublicProjectsController,
  PublicTestimonialsController,
  PublicContactController,
  PublicQuotesController,
  PublicFaqsController,
  PublicBlogController,
  PublicAboutController,
  PublicServicesController,
  PublicBeforeAfterController,
  PublicContactInfoController,
  AdminProductsController,
  AdminGalleryController,
  AdminTestimonialsController,
  AdminContactController,
  AdminQuotesController,
  AdminFaqsController,
  AdminBlogController,
  AdminAboutController,
  AdminServicesController,
  AdminBeforeAfterController,
  AdminContactInfoController,
} from './website.controller';
import { WebsiteService } from './website.service';
import { WebsiteRepository } from './website.repository';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [CacheModule.register(), UploadsModule],
  controllers: [
    PublicProductsController,
    PublicGalleryController,
    PublicProjectsController,
    PublicTestimonialsController,
    PublicContactController,
    PublicQuotesController,
    PublicFaqsController,
    PublicBlogController,
    PublicAboutController,
    PublicServicesController,
    PublicBeforeAfterController,
    PublicContactInfoController,
    AdminProductsController,
    AdminGalleryController,
    AdminTestimonialsController,
    AdminContactController,
    AdminQuotesController,
    AdminFaqsController,
    AdminBlogController,
    AdminAboutController,
    AdminServicesController,
    AdminBeforeAfterController,
    AdminContactInfoController,
  ],
  providers: [WebsiteService, WebsiteRepository],
  exports: [WebsiteService],
})
export class WebsiteModule {}
