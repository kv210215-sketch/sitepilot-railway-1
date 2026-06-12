import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { Project } from '../projects/project.entity';
import { Page } from '../pages/page.entity';
import { PublishJob, PublishStatus } from '../publish/publish-job.entity';
import { OrganizationMember } from '../organizations/entities/organization-member.entity';
import { SystemRole } from '../users/user.entity';

export interface DashboardStatsDto {
  projectsTotal:  number;
  pagesTotal:     number;
  publishTotal:   number;
  errorsTotal:    number;
  publishSuccess: number;
  publishAvgMs:   number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(Page)
    private readonly pageRepo: Repository<Page>,
    @InjectRepository(PublishJob)
    private readonly jobRepo: Repository<PublishJob>,
  ) {}

  // ── Зведена статистика для головного dashboard ────────────────────────────
  // Рахує тільки по проєктах організацій користувача (SUPER_ADMIN — по всіх).

  async dashboard(userId: string, systemRole: SystemRole): Promise<DashboardStatsDto> {
    const projQb = this.projectRepo.createQueryBuilder('p')
      .select('p.id')
      .where('p.deleted_at IS NULL');

    if (systemRole !== SystemRole.SUPER_ADMIN) {
      projQb.innerJoin(
        OrganizationMember,
        'om',
        'om.organization_id = p.organization_id AND om.user_id = :userId AND om.is_active = true',
        { userId },
      ).andWhere('p.organization_id IS NOT NULL');
    }

    const projectIds = (await projQb.getMany()).map(p => p.id);

    if (!projectIds.length) {
      return {
        projectsTotal: 0, pagesTotal: 0, publishTotal: 0,
        errorsTotal: 0, publishSuccess: 0, publishAvgMs: 0,
      };
    }

    const [pagesTotal, publishTotal, publishSuccess, errorsTotal, avgRow] = await Promise.all([
      this.pageRepo.count({ where: { projectId: In(projectIds) } }),
      this.jobRepo.count({ where: { projectId: In(projectIds) } }),
      this.jobRepo.count({ where: { projectId: In(projectIds), status: PublishStatus.SUCCESS } }),
      this.jobRepo.count({ where: { projectId: In(projectIds), status: PublishStatus.FAILED } }),
      this.jobRepo.createQueryBuilder('j')
        .select('AVG(j.duration_ms)', 'avg')
        .where('j.project_id IN (:...projectIds)', { projectIds })
        .andWhere('j.status = :status', { status: PublishStatus.SUCCESS })
        .getRawOne<{ avg: string | null }>(),
    ]);

    return {
      projectsTotal: projectIds.length,
      pagesTotal,
      publishTotal,
      errorsTotal,
      publishSuccess,
      publishAvgMs: Math.round(Number(avgRow?.avg ?? 0)),
    };
  }
}
