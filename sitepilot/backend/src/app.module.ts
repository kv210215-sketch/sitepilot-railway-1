import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';

import { appConfig, dbConfig, jwtConfig, throttleConfig, billingConfig, automationConfig } from './config/configuration';
import { GlobalExceptionFilter } from './modules/common/filters/http-exception.filter';
import { JwtAuthGuard }          from './modules/auth/guards';

// ── Modules ───────────────────────────────────────────────────────────────────
import { AuthModule }       from './modules/auth/auth.module';
import { ProjectsModule }   from './modules/projects/projects.module';
import { PagesModule }      from './modules/pages/pages.module';
import { TemplatesModule }  from './modules/templates/templates.module';
import { ContentModule }    from './modules/content/content.module';
import { SeoModule }        from './modules/seo/seo.module';
import { PublishModule }    from './modules/publish/publish.module';
import { AuditModule }      from './modules/audit/audit.module';
import { BillingModule }    from './modules/billing/billing.module';
import { AiModule }         from './modules/ai/ai.module';
import { AutomationModule } from './modules/automation/automation.module';

// ── Entities ──────────────────────────────────────────────────────────────────
import { User }          from './modules/users/user.entity';
import { Project }       from './modules/projects/project.entity';
import { ProjectMember } from './modules/projects/project-member.entity';
import { Page }          from './modules/pages/page.entity';
import { Template }      from './modules/templates/template.entity';
import { ContentBlock }  from './modules/content/content-block.entity';
import { PublishJob, PublishJobLog } from './modules/publish/publish-job.entity';
import { AuditLog }      from './modules/audit/audit-log.entity';
import { Subscription }  from './modules/billing/billing.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal:    true,
      load:        [appConfig, dbConfig, jwtConfig, throttleConfig, billingConfig, automationConfig],
      envFilePath: ['.env', '.env.local'],
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type:        'postgres',
        host:        cfg.get('db.host'),
        port:        cfg.get('db.port'),
        username:    cfg.get('db.user'),
        password:    cfg.get('db.pass'),
        database:    cfg.get('db.name'),
        ssl:         cfg.get('db.ssl') ? { rejectUnauthorized: false } : false,
        synchronize: cfg.get('db.sync'),
        logging:     cfg.get('db.logging'),
        entities:    [
          User, Project, ProjectMember,
          Page, Template, ContentBlock,
          PublishJob, PublishJobLog,
          AuditLog,
          Subscription,
        ],
      }),
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
    BillingModule, AiModule, AutomationModule,
  ],

  providers: [
    { provide: APP_FILTER,      useClass: GlobalExceptionFilter },
    { provide: APP_GUARD,       useClass: JwtAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
    {
      provide:  APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true, forbidNonWhitelisted: true,
        transform: true, transformOptions: { enableImplicitConversion: true },
      }),
    },
  ],
})
export class AppModule {}
