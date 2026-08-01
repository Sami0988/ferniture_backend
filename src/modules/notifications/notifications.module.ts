import { Module, forwardRef } from '@nestjs/common';
import { NotificationsController, FcmController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsGateway } from './notifications.gateway';
import { FcmService } from './fcm.service';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [NotificationsController, FcmController],
  providers: [
    NotificationsService,
    NotificationsRepository,
    NotificationsGateway,
    FcmService,
    WsJwtGuard,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
