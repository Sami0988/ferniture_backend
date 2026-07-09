import { Module } from '@nestjs/common';
import { PaymentLettersController } from './payment-letters.controller';
import { PaymentLettersService } from './payment-letters.service';
import { PaymentLettersRepository } from './payment-letters.repository';
import { UploadsModule } from '../uploads/uploads.module';
import { CompanySettingsModule } from '../company-settings/company-settings.module';
import { LetterTemplatesModule } from '../letter-templates/letter-templates.module';

@Module({
  imports: [UploadsModule, CompanySettingsModule, LetterTemplatesModule],
  controllers: [PaymentLettersController],
  providers: [PaymentLettersService, PaymentLettersRepository],
  exports: [PaymentLettersService],
})
export class PaymentLettersModule {}
