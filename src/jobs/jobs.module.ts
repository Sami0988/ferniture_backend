import { Module, Logger } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { EmailProcessor } from './email.processor';
import { OverdueCheckProcessor } from './overdue-check.processor';
import { DailyDigestProcessor } from './daily-digest.processor';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../modules/notifications/notifications.module';

const logger = new Logger('JobsModule');

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('app.redis.url');
        
        if (redisUrl) {
          return { 
            connection: { 
              url: redisUrl,
              enableOfflineQueue: true,
            },
            defaultJobOptions: {
              removeOnComplete: 100,
              removeOnFail: 50,
            },
          };
        }
        
        return {
          connection: {
            host: configService.get<string>('app.redis.host'),
            port: configService.get<number>('app.redis.port'),
          },
        };
      },
    }),
    BullModule.registerQueue({ name: 'email' }),
    MailModule,
    NotificationsModule,
  ],
  providers: [
    EmailProcessor,
    OverdueCheckProcessor,
    DailyDigestProcessor,
  ],
  exports: [BullModule],
})
export class JobsModule {}
