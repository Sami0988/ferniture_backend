import './instrument';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { RequestIdMiddleware } from './common/middlewares/request-id.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());

  // Compression — gzip/brotli for all responses
  app.use(compression());

  // CORS
  const corsOrigin = process.env.CORS_ORIGIN || '';
  const allowedOrigins = corsOrigin
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const allowAll = allowedOrigins.includes('*') || corsOrigin === '*';

  app.enableCors({
    origin: allowAll
      ? true
      : (origin, callback) => {
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Request ID middleware
  app.use(new RequestIdMiddleware().use);

  // API Versioning — URI-based (/api/v1/...)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v',
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger — serves v1 docs
  const config = new DocumentBuilder()
    .setTitle('Kassahun Wood & Aluminum Work API')
    .setDescription('Backend API for Admin Web App and Employee Mobile App')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Login, register, refresh tokens')
    .addTag('Users', 'User management')
    .addTag('Employees', 'Employee management')
    .addTag('Customers', 'Customer management')
    .addTag('Projects', 'Work orders and status tracking')
    .addTag('Materials', 'Material catalog and project materials')
    .addTag('Uploads', 'File uploads via Cloudinary')
    .addTag('Notifications', 'Real-time notifications and FCM')
    .addTag('Invoices', 'Invoices, payments, and PDF generation')
    .addTag('Website', 'Public website content')
    .addTag('Health', 'Health check endpoint')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`Server running on http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/docs`);
  console.log(`API base: http://localhost:${port}/api/v1`);
}
bootstrap();
