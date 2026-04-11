import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger:  ['error', 'warn', 'log', 'debug'],
    rawBody: true, // required for Stripe webhook signature verification
  });

  const config = app.get(ConfigService);
  const port    = Number(process.env.PORT) || 3000;
  const apiPrefix = config.get<string>('app.apiPrefix') ?? 'api/v1';
  const env       = config.get<string>('app.nodeEnv');
  const corsOrigins    = config.get<string[]>('app.corsOrigins') ?? [];
  const allowAllOrigins = corsOrigins.includes('*');

  const logger = new Logger('Bootstrap');

  // ── Health check ─────────────────────────────────────────────────────────────
  // Registered as raw Express middleware BEFORE the global prefix so Railway's
  // healthcheck always gets a 200 regardless of NestJS routing state.
  app.use('/health', (_req: unknown, res: any) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString(), env });
  });

  // ── Global prefix ────────────────────────────────────────────────────────────
  app.setGlobalPrefix(apiPrefix);

  // ── CORS ─────────────────────────────────────────────────────────────────────
  app.enableCors({
    origin:         allowAllOrigins ? true : corsOrigins,
    methods:        ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials:    !allowAllOrigins,
  });

  // ── Swagger (dev only) ───────────────────────────────────────────────────────
  if (env !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('SitePilot API')
      .setDescription('Керуюча платформа для solomiya-energy.com')
      .setVersion('1.0.0')
      .addBearerAuth()
      .addServer(`http://localhost:${port}`, 'Local')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });

    logger.log(`Swagger: http://localhost:${port}/docs`);
  }

  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 SitePilot API running on port ${port} [${env}]`);
}

bootstrap();
