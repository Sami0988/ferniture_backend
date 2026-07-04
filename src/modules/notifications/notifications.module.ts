import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationsController, FcmController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsGateway } from './notifications.gateway';
import { FcmService } from './fcm.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('app.jwt.accessSecret'),
      }),
    }),
  ],
  controllers: [NotificationsController, FcmController],
  providers: [
    NotificationsService,
    NotificationsRepository,
    NotificationsGateway,
    FcmService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
