import {
  Injectable, NotFoundException, BadRequestException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { PublishJob, PublishJobLog, PublishScope, PublishStatus } from './publish-job.entity';
import { CreatePublishJobDto, ListJobsDto, PublishJobResponseDto, PaginatedJobsDto } from './publish.dto';
import { Page, PageStatus } from '../pages/page.entity';
import { Project } from '../projects/project.entity';
import { AuditService } from '../audit/audit.service';
import { PublishCacheInvalidationService } from './publish-cache-invalidation.service';

@Injectable()
export class PublishService {
  private readonly logger = new Logger(PublishService.name);

  constructor(
    @InjectRepository(PublishJob)
    private readonly jobRepo: Repository<PublishJob>,
    @InjectRepository(PublishJobLog)
    private readonly logRepo: Repository<PublishJobLog>,
    @InjectRepository(Page)
    private readonly pageRepo: Repository<Page>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    private readonly audit: AuditService,
    private readonly cacheInvalidation: PublishCacheInvalidationService,
  ) {}

  // ── Створити job ──────────────────────────────────────────────────────────

  async create(
    projectId: string,
    dto:       CreatePublishJobDto,
    userId:    string,
  ): Promise<PublishJobResponseDto> {
    // Визначаємо які сторінки будуть публікуватись
    let pages: Page[] = [];

    if (dto.scope === PublishScope.PAGE) {
      if (!dto.pageIds?.length) throw new BadRequestException('Вкажіть pageIds для scope=page');
      pages = await this.pageRepo.find({
        where: { id: In(dto.pageIds), projectId },
      });
    } else if (dto.scope === PublishScope.SELECTED) {
      if (!dto.pageIds?.length) throw new BadRequestException('Вкажіть pageIds для scope=selected');
      pages = await this.pageRepo.find({
        where: { id: In(dto.pageIds), projectId },
      });
    } else {
      // PROJECT — всі готові сторінки
      pages = await this.pageRepo.find({
        where: { projectId, status: PageStatus.READY },
      });
      if (!pages.length) {
        // Якщо немає READY — беремо всі крім archived/deleted
        pages = await this.pageRepo.find({
          where: [
            { projectId, status: PageStatus.GENERATED },
            { projectId, status: PageStatus.PUBLISHED },
          ],
        });
      }
    }

    const job = this.jobRepo.create({
      projectId,
      initiatedBy:  userId,
      scope:        dto.scope,
      status:       PublishStatus.QUEUED,
      pageIds:      pages.map(p => p.id),
      pagesTotal:   pages.length,
      pagesSuccess: 0,
      pagesFailed:  0,
      attempt:      1,
      maxAttempts:  3,
      priority:     dto.priority ?? 5,
      queuedAt:     new Date(),
    });

    await this.jobRepo.save(job);
    await this.writeLog(job.id, 'info', `Job створено: ${dto.scope}, ${pages.length} сторінок`);

    await this.audit.log({
      userId,
      projectId,
      action:     'publish_started',
      entityType: 'publish_job',
      entityId:   job.id,
      entityName: `${dto.scope} (${pages.length} сторінок)`,
    });

    this.logger.log(`PublishJob created: ${job.id} scope=${dto.scope} pages=${pages.length}`);

    // Запускаємо обробку асинхронно
    this.processJob(job.id).catch(err =>
      this.logger.error(`Job ${job.id} failed: ${err.message}`)
    );

    return this.toResponse(job);
  }

  // ── Обробка job (симуляція — в prod замінити на реальний publish) ─────────

  private async processJob(jobId: string): Promise<void> {
    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job) return;

    // Оновлюємо статус на PROCESSING
    await this.jobRepo.update(jobId, {
      status:    PublishStatus.PROCESSING,
      startedAt: new Date(),
    });
    await this.writeLog(jobId, 'info', 'Починаємо обробку...');

    const startTime = Date.now();
    let success = 0;
    let failed  = 0;

    const project = await this.projectRepo.findOne({ where: { id: job.projectId } });

    // Обробляємо кожну сторінку
    for (const pageId of job.pageIds) {
      const pageStart = Date.now();
      try {
        // TODO: тут буде реальний publish (Tilda API / Playwright)
        // Поки — симуляція з 95% успіхом
        await this.simulatePagePublish(pageId);

        // Оновлюємо статус сторінки
        await this.pageRepo.update(pageId, {
          status:      PageStatus.PUBLISHED,
          publishedAt: new Date(),
        });

        const publishedPage = await this.pageRepo.findOne({ where: { id: pageId } });
        if (publishedPage) {
          this.cacheInvalidation
            .invalidateAfterPublish({
              projectId:  job.projectId,
              projectSlug:  project?.slug ?? '',
              paths:        [publishedPage.path ?? '/'],
              scope:        'page',
            })
            .catch(err => {
              const msg = err instanceof Error ? err.message : String(err);
              this.logger.warn(`Cache invalidation stub failed for page ${pageId}: ${msg}`);
            });
        }

        success++;
        const duration = Date.now() - pageStart;
        await this.writeLog(jobId, 'info', `✓ Сторінка опублікована`, { pageId, duration_ms: duration }, duration);

        // Оновлюємо лічильники в реальному часі
        await this.jobRepo.update(jobId, {
          pagesSuccess: success,
          pagesFailed:  failed,
        });
      } catch (err: unknown) {
        failed++;
        const msg = err instanceof Error ? err.message : String(err);
        await this.writeLog(jobId, 'error', `✗ Помилка сторінки: ${msg}`, { pageId });
        await this.jobRepo.update(jobId, { pagesFailed: failed });
      }
    }

    // Фінальний статус
    const totalDuration = Date.now() - startTime;
    const finalStatus   = failed === 0
      ? PublishStatus.SUCCESS
      : failed === job.pageIds.length
      ? PublishStatus.FAILED
      : PublishStatus.SUCCESS; // частковий успіх — все одно SUCCESS

    await this.jobRepo.update(jobId, {
      status:      finalStatus,
      completedAt: new Date(),
      durationMs:  totalDuration,
      pagesSuccess: success,
      pagesFailed:  failed,
      result: { success, failed, duration_ms: totalDuration },
      ...(failed > 0 && { errorMessage: `${failed} сторінок не вдалось опублікувати` }),
    });

    const action = finalStatus === PublishStatus.SUCCESS ? 'publish_success' : 'publish_failed';
    await this.audit.log({
      userId:     job.initiatedBy ?? 'system',
      projectId:  job.projectId,
      action,
      entityType: 'publish_job',
      entityId:   jobId,
      entityName: `${job.scope} — ${success}/${job.pagesTotal} сторінок`,
      changes:    { success, failed, duration_ms: totalDuration },
    });

    await this.writeLog(
      jobId,
      failed > 0 ? 'warn' : 'info',
      `Завершено: ${success} успішно, ${failed} помилок. ${(totalDuration / 1000).toFixed(1)}s`,
      {}, totalDuration,
    );

    this.logger.log(`Job ${jobId} ${finalStatus}: ${success}/${job.pageIds.length} pages in ${totalDuration}ms`);
  }

  private async simulatePagePublish(_pageId: string): Promise<void> {
    // Симуляція затримки 200-800ms на сторінку
    const delay = 200 + Math.random() * 600;
    await new Promise(r => setTimeout(r, delay));
    // 5% шанс помилки
    if (Math.random() < 0.05) throw new Error('Timeout connecting to Tilda');
  }

  // ── Retry ─────────────────────────────────────────────────────────────────

  async retry(projectId: string, jobId: string, userId: string): Promise<PublishJobResponseDto> {
    const job = await this.findJob(projectId, jobId);

    if (job.status !== PublishStatus.FAILED && job.status !== PublishStatus.CANCELLED) {
      throw new BadRequestException('Retry доступний тільки для failed/cancelled jobs');
    }
    if (job.attempt >= job.maxAttempts) {
      throw new BadRequestException(`Вичерпано максимум спроб (${job.maxAttempts})`);
    }

    await this.jobRepo.update(jobId, {
      status:     PublishStatus.QUEUED,
      attempt:    job.attempt + 1,
      startedAt:  null,
      completedAt: null,
      pagesSuccess: 0,
      pagesFailed:  0,
      errorMessage: null,
      nextRetryAt:  null,
    });

    await this.writeLog(jobId, 'info', `Retry спроба ${job.attempt + 1}/${job.maxAttempts}`);

    const updated = await this.findJob(projectId, jobId);
    this.processJob(jobId).catch(err =>
      this.logger.error(`Retry job ${jobId} failed: ${err.message}`)
    );

    return this.toResponse(updated);
  }

  // ── Cancel ────────────────────────────────────────────────────────────────

  async cancel(projectId: string, jobId: string, userId: string): Promise<PublishJobResponseDto> {
    const job = await this.findJob(projectId, jobId);

    if (![PublishStatus.PENDING, PublishStatus.QUEUED].includes(job.status)) {
      throw new BadRequestException('Можна скасувати тільки pending/queued job');
    }

    await this.jobRepo.update(jobId, {
      status:      PublishStatus.CANCELLED,
      completedAt: new Date(),
    });

    await this.writeLog(jobId, 'warn', `Job скасовано користувачем`);
    await this.audit.log({
      userId, projectId, action: 'publish_cancelled',
      entityType: 'publish_job', entityId: jobId, entityName: job.scope,
    });

    return this.toResponse(await this.findJob(projectId, jobId));
  }

  // ── List / Get ────────────────────────────────────────────────────────────

  async list(projectId: string, query: ListJobsDto): Promise<PaginatedJobsDto> {
    const { status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * Math.min(limit, 100);

    const qb = this.jobRepo.createQueryBuilder('j')
      .leftJoinAndSelect('j.initiator', 'u')
      .where('j.project_id = :projectId', { projectId })
      .orderBy('j.queued_at', 'DESC');

    if (status) qb.andWhere('j.status = :status', { status });

    const [jobs, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data:       jobs.map(this.toResponse),
      total, page, limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getOne(projectId: string, jobId: string): Promise<PublishJobResponseDto> {
    const job = await this.findJob(projectId, jobId);
    return this.toResponse(job);
  }

  async getLogs(projectId: string, jobId: string) {
    await this.findJob(projectId, jobId);
    return this.logRepo.find({
      where: { jobId },
      order: { createdAt: 'ASC' },
    });
  }

  // ── Dashboard stats ───────────────────────────────────────────────────────

  async getStats(projectId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, todayJobs] = await Promise.all([
      this.jobRepo.count({ where: { projectId } }),
      this.jobRepo.find({
        where: { projectId },
        order: { queuedAt: 'DESC' },
        take: 50,
      }),
    ]);

    const statusCounts = todayJobs.reduce<Record<string, number>>((acc, j) => {
      acc[j.status] = (acc[j.status] ?? 0) + 1;
      return acc;
    }, {});

    const successJobs = todayJobs.filter(j => j.status === PublishStatus.SUCCESS);
    const avgDuration = successJobs.length
      ? Math.round(successJobs.reduce((s, j) => s + (j.durationMs ?? 0), 0) / successJobs.length)
      : 0;

    const successRate = total > 0
      ? Math.round(((statusCounts[PublishStatus.SUCCESS] ?? 0) / total) * 100)
      : 0;

    return {
      total,
      statusCounts,
      avgDurationMs: avgDuration,
      successRate,
      activeJobs: (statusCounts[PublishStatus.PROCESSING] ?? 0) + (statusCounts[PublishStatus.QUEUED] ?? 0),
    };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async findJob(projectId: string, jobId: string): Promise<PublishJob> {
    const job = await this.jobRepo.findOne({
      where: { id: jobId, projectId },
      relations: ['initiator'],
    });
    if (!job) throw new NotFoundException('Job не знайдено');
    return job;
  }

  private async writeLog(
    jobId:      string,
    level:      'info' | 'warn' | 'error',
    message:    string,
    context:    Record<string, unknown> = {},
    durationMs?: number,
  ) {
    const log = this.logRepo.create({ jobId, level, message, context, durationMs });
    await this.logRepo.save(log);
  }

  toResponse(j: PublishJob): PublishJobResponseDto {
    return {
      id:           j.id,
      projectId:    j.projectId,
      scope:        j.scope,
      status:       j.status,
      pagesTotal:   j.pagesTotal,
      pagesSuccess: j.pagesSuccess,
      pagesFailed:  j.pagesFailed,
      attempt:      j.attempt,
      maxAttempts:  j.maxAttempts,
      priority:     j.priority,
      durationMs:   j.durationMs,
      errorMessage: j.errorMessage,
      startedAt:    j.startedAt,
      completedAt:  j.completedAt,
      queuedAt:     j.queuedAt,
      createdAt:    j.createdAt,
      initiatorName: (j.initiator as any)?.name,
    };
  }
}
