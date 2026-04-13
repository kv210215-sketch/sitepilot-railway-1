import * as dotenv from 'dotenv';
import * as http from 'http';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';

dotenv.config({ path: join(__dirname, '../.env') });
dotenv.config({ path: join(__dirname, '../.env.local'), override: true });

async function bootstrap() {
  const { AppModule } = await import('./app.module');
  const port = Number(process.env.PORT) || 3000;
  const logger = new Logger('Bootstrap');

  // ── Pre-start health server ───────────────────────────────────────────────
  // Starts immediately — before NestJS module init (which blocks on TypeORM
  // DB retries). Railway healthcheck gets 200 from the first probe.
  const preServer = http.createServer((req, res) => {
    if (req.url === '/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', starting: true, ts: new Date().toISOString() }));
    } else {
      res.writeHead(503);
      res.end();
    }
  });
  await new Promise<void>(resolve => preServer.listen(port, '0.0.0.0', resolve));
  logger.log(`⚡ Pre-start health server listening on port ${port}`);

  // ── NestJS bootstrap (TypeORM retries happen here) ────────────────────────
  const app = await NestFactory.create(AppModule, {
    logger:  ['error', 'warn', 'log', 'debug'],
    rawBody: true, // required for Stripe webhook signature verification
  });

  const config        = app.get(ConfigService);
  const apiPrefix     = config.get<string>('app.apiPrefix') ?? 'api/v1';
  const env           = config.get<string>('app.nodeEnv');
  const corsOrigins   = config.get<string[]>('app.corsOrigins') ?? [];
  const allowAll      = corsOrigins.includes('*');

  // Health endpoint on the NestJS app (after handoff)
  app.use('/health', (_req: unknown, res: any) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString(), env });
  });

  app.setGlobalPrefix(apiPrefix);

  app.enableCors({
    origin:         allowAll ? true : corsOrigins,
    methods:        ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials:    !allowAll,
  });

  if (env !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('SitePilot API')
      .setDescription('Керуюча платформа для solomiya-energy.com')
      .setVersion('1.0.0')
      .addBearerAuth()
      .addServer(`http://localhost:${port}`, 'Local')
      .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig), {
      swaggerOptions: { persistAuthorization: true },
    });
    logger.log(`Swagger: http://localhost:${port}/docs`);
  }

  // ── Hand off: close pre-server, start NestJS on same port ────────────────
  await new Promise<void>(resolve => preServer.close(() => resolve()));
  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 SitePilot API running on port ${port} [${env}]`);
}

bootstrap();
