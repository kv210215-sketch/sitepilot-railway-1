import { INestApplication, RequestMethod } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';

import { AppModule } from '../../src/app.module';

/**
 * Boots the REAL AppModule and mirrors main.ts runtime behaviour that isn't
 * provided by AppModule's APP_* providers:
 *   - global prefix `api/v1` with the `public/v1/*` exclusion.
 *   - `trust proxy` = 1, so req.ip (the ThrottlerGuard tracker) honours
 *     X-Forwarded-For — lets tests simulate distinct client IPs.
 * (ValidationPipe, guards, exception filter and serializer are already wired
 *  as APP_PIPE/APP_GUARD/APP_FILTER/APP_INTERCEPTOR providers in AppModule.)
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>();
  app.set('trust proxy', 1);
  app.setGlobalPrefix(process.env.API_PREFIX ?? 'api/v1', {
    exclude: [{ path: 'public/v1/(.*)', method: RequestMethod.ALL }],
  });
  await app.init();
  return app;
}
