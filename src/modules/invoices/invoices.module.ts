import { Module, forwardRef } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { InvoicesRepository } from './invoices.repository';
import { UploadsModule } from '../uploads/uploads.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CompanySettingsModule } from '../company-settings/company-settings.module';
import { MailModule } from '../../mail/mail.module';

@Module({
  imports: [forwardRef(() => UploadsModule), NotificationsModule, CompanySettingsModule, MailModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoicesRepository],
  exports: [InvoicesService],
})
export class InvoicesModule {}
