import { Module } from '@nestjs/common';
import { CompanySettingsController } from './company-settings.controller';
import { CompanySettingsService } from './company-settings.service';
import { CompanySettingsRepository } from './company-settings.repository';

@Module({
  controllers: [CompanySettingsController],
  providers: [CompanySettingsService, CompanySettingsRepository],
  exports: [CompanySettingsService],
})
export class CompanySettingsModule {}
