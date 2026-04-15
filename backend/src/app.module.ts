import { ClassSerializerInterceptor, Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';

import { appConfig, automationConfig, billingConfig, dbConfig, jwtConfig, throttleConfig } from './config/configuration';
import { validateEnv } from './config/env.validation';
import { JwtAuthGuard } from './modules/auth/guards';
import { GlobalExceptionFilter } from './modules/common/filters/http-exception.filter';

// ── Modules ───────────────────────────────────────────────────────────────────
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

import { AuditLog } from './modules/audit/audit-log.entity';
import { Subscription } from './modules/billing/billing.entity';
import { ContentBlock } from './modules/content/content-block.entity';
import { OnboardingSession } from './modules/onboarding/onboarding.entity';
import { Page } from './modules/pages/page.entity';
import { ProjectMember } from './modules/projects/project-member.entity';
import { Project } from './modules/projects/project.entity';
import { PublishJob, PublishJobLog } from './modules/publish/publish-job.entity';
import { Template } from './modules/templates/template.entity';
import { User } from './modules/users/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, dbConfig, jwtConfig, throttleConfig, billingConfig, automationConfig],
      envFilePath: [
        join(__dirname, '..', '.env.local'),
        join(__dirname, '..', '.env'),
      ],
      validate: validateEnv,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const url = cfg.get<string>('db.url');
        const ssl = cfg.get<boolean>('db.ssl') ? { rejectUnauthorized: false } : false;
        const synchronize = cfg.get<boolean>('db.sync');
        const logging = cfg.get<boolean>('db.logging');

        return {
          type: 'postgres',
          ...(url
            ? { url }
            : {
                host: cfg.get<string>('db.host'),
                port: cfg.get<number>('db.port'),
                username: cfg.get<string>('db.user'),
                password: cfg.get<string>('db.pass'),
                database: cfg.get<string>('db.name'),
              }),
          ssl,
          synchronize,
          logging,
          retryAttempts: 10,
          retryDelay: 3000,
          entities: [
            User, Project, ProjectMember,
            Page, Template, ContentBlock,
            PublishJob, PublishJobLog,
            AuditLog,
            Subscription,
            OnboardingSession,
          ],
        };
      },
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService): ThrottlerModuleOptions => ({
        throttlers: [{
          ttl: cfg.get<number>('throttle.ttl') ?? 60,
          limit: cfg.get<number>('throttle.limit') ?? 10,
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
        whitelist: true, forbidNonWhitelisted: true,
        transform: true, transformOptions: { enableImplicitConversion: true },
      }),
    },
  ],
})
export class AppModule { }
