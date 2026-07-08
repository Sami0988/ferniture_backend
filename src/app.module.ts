import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SentryModule } from '@sentry/nestjs/setup';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { validationSchema } from './config/env.validation';
import { DrizzleModule } from './database/drizzle.module';
import { RedisCacheModule } from './common/modules/redis-cache.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { MaterialsModule } from './modules/materials/materials.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ReportsModule } from './modules/reports/reports.module';
import { WebsiteModule } from './modules/website/website.module';
import { CompanySettingsModule } from './modules/company-settings/company-settings.module';
import { HealthModule } from './health/health.module';
import { SmsModule } from './modules/sms/sms.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 60,
          name: 'default',
        },
        {
          ttl: 900000,
          limit: 5,
          name: 'auth',
        },
      ],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    RedisCacheModule,
    DrizzleModule,
    AuthModule,
    UsersModule,
    EmployeesModule,
    CustomersModule,
    ProjectsModule,
    MaterialsModule,
    UploadsModule,
    NotificationsModule,
    InvoicesModule,
    PaymentsModule,
    ReportsModule,
    WebsiteModule,
    CompanySettingsModule,
    HealthModule,
    SmsModule,
    AuditLogsModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
