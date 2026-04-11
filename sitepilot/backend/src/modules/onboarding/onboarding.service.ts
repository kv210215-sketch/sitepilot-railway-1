import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { OnboardingSession, OnboardingStep, BusinessType, BusinessGoal } from './onboarding.entity';
import {
  StartResponseDto, SetTypeDto, SetGoalDto, SetDataDto, SessionStepDto,
  OnboardingStatusDto, OnboardingStepResponseDto,
} from './onboarding.dto';
import { AiService } from '../ai/ai.service';
import { SiteType, BudgetRange, SiteGoal } from '../ai/ai.dto';

@Injectable()
export class OnboardingService {
  constructor(
    @InjectRepository(OnboardingSession)
    private readonly repo: Repository<OnboardingSession>,
    private readonly ai: AiService,
  ) {}

  // ── Step 1: Start ─────────────────────────────────────────────────────────

  async start(userId?: string): Promise<StartResponseDto> {
    const session = this.repo.create({
      userId: userId ?? null,
      step:   OnboardingStep.TYPE,
    });
    await this.repo.save(session);

    return {
      sessionId: session.id,
      step:      session.step,
      message:   'Зберемо систему, яка приводить заявки за кілька хвилин. Почнемо!',
    };
  }

  // ── Step 2: Business type ─────────────────────────────────────────────────

  async setType(dto: SetTypeDto): Promise<OnboardingStepResponseDto> {
    const session = await this.findOrFail(dto.sessionId);
    session.businessType = dto.type;
    session.step         = OnboardingStep.GOAL;
    await this.repo.save(session);

    const labels: Record<BusinessType, string> = {
      [BusinessType.SOLAR]:    'СЕС / Енергетика',
      [BusinessType.SERVICES]: 'Послуги',
      [BusinessType.OTHER]:    'Інше',
    };

    return {
      sessionId: session.id,
      step:      session.step,
      message:   `Тип бізнесу: ${labels[dto.type]}. Тепер оберіть головну ціль.`,
    };
  }

  // ── Step 3: Goal ──────────────────────────────────────────────────────────

  async setGoal(dto: SetGoalDto): Promise<OnboardingStepResponseDto> {
    const session = await this.findOrFail(dto.sessionId);
    session.businessGoal = dto.goal;
    session.step         = OnboardingStep.DATA;
    await this.repo.save(session);

    return {
      sessionId: session.id,
      step:      session.step,
      message:   'Майже готово! Введіть основні дані про ваш бізнес.',
    };
  }

  // ── Step 4: Data ──────────────────────────────────────────────────────────

  async setData(dto: SetDataDto): Promise<OnboardingStepResponseDto> {
    const session = await this.findOrFail(dto.sessionId);
    session.data = {
      ...session.data,
      name:  dto.name,
      city:  dto.city,
      phone: dto.phone ?? null,
      email: dto.email ?? null,
    };
    session.step = OnboardingStep.GENERATE;
    await this.repo.save(session);

    return {
      sessionId: session.id,
      step:      session.step,
      message:   `Дані збережено! Генеруємо сайт для "${dto.name}" у ${dto.city}.`,
    };
  }

  // ── Step 5: Generate ──────────────────────────────────────────────────────

  async generate(dto: SessionStepDto): Promise<OnboardingStepResponseDto> {
    const session = await this.findOrFail(dto.sessionId);
    const data    = session.data as Record<string, string>;

    const siteType = session.businessType === BusinessType.SERVICES
      ? SiteType.BUSINESS
      : session.businessType === BusinessType.SOLAR
        ? SiteType.BUSINESS
        : SiteType.HOME;

    const siteGoal = session.businessGoal === BusinessGoal.LEADS
      ? SiteGoal.LEADS
      : session.businessGoal === BusinessGoal.SALES
        ? SiteGoal.SELL_DIRECT
        : SiteGoal.INFORM;

    const generated = await this.ai.generateSite({
      type:        siteType,
      budget:      BudgetRange.MEDIUM,
      goal:        siteGoal,
      city:        data.city ?? 'Україна',
      companyName: data.name ?? 'Solomiya Energy',
    });

    session.generatedSite = generated as unknown as Record<string, unknown>;
    session.step          = OnboardingStep.PUBLISH;
    await this.repo.save(session);

    const hero = generated.pages[0]?.blocks.find(b => b.type === 'hero');

    return {
      sessionId: session.id,
      step:      session.step,
      message:   `AI згенерував сайт "${generated.projectName}" — ${generated.pages.length} сторінок. Готово до публікації!`,
      payload: {
        projectName: generated.projectName,
        slug:        generated.slug,
        pageCount:   generated.pages.length,
        hero:        (hero?.data as Record<string,unknown>)?.title ?? '',
        sections:    generated.pages.map(p => p.title),
      },
    };
  }

  // ── Step 6: Publish ───────────────────────────────────────────────────────

  async publish(dto: SessionStepDto): Promise<OnboardingStepResponseDto> {
    const session = await this.findOrFail(dto.sessionId);
    session.published = true;
    session.completed = true;
    session.step      = OnboardingStep.DONE;
    await this.repo.save(session);

    return {
      sessionId: session.id,
      step:      session.step,
      message:   'Сайт готовий! 🎉 Запустіть AI чат або підключіть рекламу для отримання заявок.',
      payload:   {
        nextActions: [
          { label: 'Запустити AI чат', action: 'start_chat' },
          { label: 'Підключити рекламу', action: 'connect_ads' },
          { label: 'Додати квіз', action: 'add_quiz' },
        ],
      },
    };
  }

  // ── Status ────────────────────────────────────────────────────────────────

  async getStatus(sessionId: string): Promise<OnboardingStatusDto> {
    const session = await this.findOrFail(sessionId);
    return {
      sessionId:     session.id,
      step:          session.step,
      completed:     session.completed,
      published:     session.published,
      generatedSite: session.generatedSite,
      data:          session.data,
    };
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private async findOrFail(id: string): Promise<OnboardingSession> {
    const session = await this.repo.findOne({ where: { id } });
    if (!session) throw new NotFoundException(`Onboarding session not found: ${id}`);
    return session;
  }
}
