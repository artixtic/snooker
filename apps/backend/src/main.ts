import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { DatabaseInitService } from './prisma/database-init.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Initialize database and run migrations before starting the server
  const databaseInitService = app.get(DatabaseInitService);
  await databaseInitService.initialize();

  // Cookie parser for refresh tokens
  app.use(cookieParser());

  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 3001;
  const corsOrigin = configService.get('CORS_ORIGIN') || 'http://localhost:3000';

  // Enable CORS for frontend
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(port);
  console.log(`🚀 Backend server running on http://localhost:${port}`);
}

bootstrap();

