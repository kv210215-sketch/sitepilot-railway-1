import { NestFactory, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('app.port') ?? 3001;
  const apiPrefix = config.get<string>('app.apiPrefix') ?? 'api/v1';
  const env = config.get<string>('app.nodeEnv');
  const corsOrigins = config.get<string[]>('app.corsOrigins') ?? [];

  const logger = new Logger('Bootstrap');

  // ── Global prefix ───────────────────────────────────────────────────────────
  app.setGlobalPrefix(apiPrefix);

  // ── CORS ────────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // ── Swagger (dev only) ──────────────────────────────────────────────────────
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

  // ── Health check ─────────────────────────────────────────────────────────────
  // Quick endpoint without loading full module — just confirm server is alive
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/health', (_req: unknown, res: { json: (v: unknown) => void }) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), env });
  });

  await app.listen(port);
  logger.log(`🚀 SitePilot API running on http://localhost:${port}/${apiPrefix}`);
}

bootstrap();
