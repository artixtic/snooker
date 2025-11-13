import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const app = await NestFactory.create(AppModule, {
      logger: isProduction 
        ? ['error', 'warn', 'log'] 
        : ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // Cookie parser for refresh tokens
    app.use(cookieParser());

    const configService = app.get(ConfigService);
    const port = configService.get('PORT') || process.env.PORT || 3001;
    const corsOrigin = configService.get('CORS_ORIGIN') || process.env.CORS_ORIGIN || 'http://localhost:3000';

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
  } catch (error: any) {
    console.error('❌ Failed to start application:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('❌ Unhandled error in bootstrap:', error);
  process.exit(1);
});

