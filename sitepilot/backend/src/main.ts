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

  // Pre-start health server starts before TypeORM DB retries so Railway
  // healthchecks get 200 from the first probe.
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
  logger.log(`Pre-start health server listening on port ${port}`);

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
    rawBody: true, // required for Stripe webhook signature verification
  });

  app.enableShutdownHooks();

  const config = app.get(ConfigService);
  const env = config.get<string>('NODE_ENV') ?? 'development';
  const rawOrigins = config.get<string>('CORS_ORIGINS') ?? '';
  const corsOrigins = rawOrigins
    ? rawOrigins.split(',').map(o => o.trim()).filter(Boolean)
    : [];

  app.use('/health', (_req: unknown, res: any) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString(), env });
  });

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: corsOrigins.length ? corsOrigins : true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: corsOrigins.length > 0,
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

  await new Promise<void>(resolve => preServer.close(() => resolve()));
  await app.listen(port, '0.0.0.0');
  logger.log(`SitePilot API running on port ${port} [${env}]`);
}

bootstrap().catch(err => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
