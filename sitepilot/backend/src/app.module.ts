import { ClassSerializerInterceptor, Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtAuthGuard } from './modules/auth/guards';
import { GlobalExceptionFilter } from './modules/common/filters/http-exception.filter';

// ── Feature modules ───────────────────────────────────────────────────────────
import { AiModule } from './modules/ai/ai.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { AutomationModule } from './modules/automation/automation.module';
import { BillingModule } from './modules/billing/billing.module';
import { ContentModule } from './modules/content/content.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { PagesModule } from './modules/pages/pages.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { PublishModule } from './modules/publish/publish.module';
import { SeoModule } from './modules/seo/seo.module';
import { TemplatesModule } from './modules/templates/templates.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const url = cfg.get<string>('DATABASE_URL');
        const isProduction = cfg.get<string>('NODE_ENV') === 'production';

        return {
          type: 'postgres',
          ...(url
            ? { url }
            : {
                host: cfg.get<string>('DB_HOST') ?? 'localhost',
                port: cfg.get<number>('DB_PORT') ?? 5432,
                username: cfg.get<string>('DB_USERNAME'),
                password: cfg.get<string>('DB_PASSWORD'),
                database: cfg.get<string>('DB_NAME'),
              }),
          ssl: isProduction ? { rejectUnauthorized: false } : false,
          synchronize: false,
          autoLoadEntities: true,
          retryAttempts: 10,
          retryDelay: 3000,
          logging: !isProduction,
        };
      },
    }),

    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService): ThrottlerModuleOptions => ({
        throttlers: [{
          ttl: cfg.get<number>('THROTTLE_TTL') ?? 60,
          limit: cfg.get<number>('THROTTLE_LIMIT') ?? 10,
        }],
      }),
    }),

    AuthModule, ProjectsModule, PagesModule,
    TemplatesModule, ContentModule, SeoModule,
    AuditModule, PublishModule,
    BillingModule, AiModule, AutomationModule, OnboardingModule,
  ],

  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    },
  ],
})
export class AppModule {}
