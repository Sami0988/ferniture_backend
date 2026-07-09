import { Module } from '@nestjs/common';
import { LetterTemplatesController } from './letter-templates.controller';
import { LetterTemplatesService } from './letter-templates.service';
import { LetterTemplatesRepository } from './letter-templates.repository';
import { UploadsModule } from '../uploads/uploads.module';
import { CompanySettingsModule } from '../company-settings/company-settings.module';

@Module({
  imports: [UploadsModule, CompanySettingsModule],
  controllers: [LetterTemplatesController],
  providers: [LetterTemplatesService, LetterTemplatesRepository],
  exports: [LetterTemplatesService, LetterTemplatesRepository],
})
export class LetterTemplatesModule {}
