import { Module, forwardRef } from '@nestjs/common';
import { ProformasController } from './proformas.controller';
import { ProformasService } from './proformas.service';
import { ProformasRepository } from './proformas.repository';
import { UploadsModule } from '../uploads/uploads.module';
import { CompanySettingsModule } from '../company-settings/company-settings.module';

@Module({
  imports: [forwardRef(() => UploadsModule), CompanySettingsModule],
  controllers: [ProformasController],
  providers: [ProformasService, ProformasRepository],
  exports: [ProformasService],
})
export class ProformasModule {}
