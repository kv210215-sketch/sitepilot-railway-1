import * as dotenv from 'dotenv';
import * as http from 'http';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, RequestMethod } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppModule } from './app.module';

// Load .env before NestJS starts so PORT is available for the pre-start health server.
// ConfigModule re-loads the same files as the canonical source of truth during bootstrap.
dotenv.config({ path: join(__dirname, '../.env') });
dotenv.config({ path: join(__dirname, '../.env.local'), override: true });

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const port = Number(process.env.PORT) || 3001;
  const isProd = process.env.NODE_ENV === 'production';

  // ── Pre-start health server ───────────────────────────────────────────────
  // Responds to /health immediately while TypeORM connects and retries.
  // Required for Railway / Render healthchecks that probe before the app is ready.
  const preServer = http.createServer((req, res) => {
    if (req.url === '/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'starting', ts: new Date().toISOString() }));
    } else {
      res.writeHead(503);
      res.end();
    }
  });
  await new Promise<void>((resolve, reject) => {
    preServer.once('error', reject);
    preServer.listen(port, '0.0.0.0', resolve);
  });
  logger.log(`⚡ Pre-start health server on :${port}`);

  // ── NestJS application ────────────────────────────────────────────────────
  const app = await NestFactory.create(AppModule, {
    logger: isProd ? ['error', 'warn', 'log'] : ['error', 'warn', 'log', 'debug'],
    rawBody: true, // required for Stripe webhook signature verification
  });

  const cfg         = app.get(ConfigService);
  const env         = cfg.get<string>('app.nodeEnv') ?? 'development';
  const apiPrefix   = cfg.get<string>('app.apiPrefix') ?? 'api/v1';
  const corsOrigins = cfg.get<string[]>('app.corsOrigins') ?? [];
  const allowAll    = corsOrigins.includes('*');

  // ── Graceful shutdown ─────────────────────────────────────────────────────
  app.enableShutdownHooks();

  // ── Health endpoint (outside global prefix) ───────────────────────────────
  app.use('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', env, ts: new Date().toISOString() });
  });

  // ── Global API prefix ─────────────────────────────────────────────────────
  app.setGlobalPrefix(apiPrefix, {
    exclude: [{ path: 'public/v1/(.*)', method: RequestMethod.ALL }],
  });

  // ── CORS ──────────────────────────────────────────────────────────────────
  app.enableCors({
    origin:         allowAll ? true : corsOrigins,
    methods:        ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials:    !allowAll,
  });

  // ── Swagger (dev / staging only) ──────────────────────────────────────────
  if (env !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('SitePilot API')
      .setDescription('SitePilot — AI-powered website builder backend')
      .setVersion('1.0.0')
      .addBearerAuth()
      .addServer(`http://localhost:${port}`, 'Local')
      .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig), {
      swaggerOptions: { persistAuthorization: true },
    });
    logger.log(`Swagger: http://localhost:${port}/docs`);
  }

  // ── Hand off: close pre-server, start NestJS on the same port ────────────
  await new Promise<void>(resolve => preServer.close(() => resolve()));
  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 SitePilot API ready on :${port} [${env}]`);
}

bootstrap().catch(err => {
  new Logger('Bootstrap').error('Fatal: application failed to start', err?.stack ?? err);
  process.exit(1);
});
