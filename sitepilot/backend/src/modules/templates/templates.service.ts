import { Injectable, NotFoundException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template, TemplateBlockDef } from './template.entity';

interface BuildBlocksInput {
  content:      Record<string, unknown>;
  city?:        string;
  power?:       number;
  audience?:    'home' | 'business';
  customFields?: Record<string, string>;
}

@Injectable()
export class TemplatesService implements OnModuleInit {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(
    @InjectRepository(Template)
    private readonly repo: Repository<Template>,
  ) {}

  // ── Seed шаблонів при старті ──────────────────────────────────────────────

  async onModuleInit() {
    if (!(await this.tableExists('templates'))) {
      this.logger.warn('Skipping template seed because the "templates" table does not exist yet.');
      return;
    }

    const count = await this.repo.count({ where: { isGlobal: true } });
    if (count === 0) {
      await this.seedSolomiyaTemplates();
    }
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────

  async list(projectId?: string) {
    const qb = this.repo.createQueryBuilder('t')
      .where('t.deleted_at IS NULL AND t.is_active = true')
      .andWhere('(t.is_global = true OR t.project_id = :pid)', { pid: projectId ?? 'none' })
      .orderBy('t.category', 'ASC')
      .addOrderBy('t.name', 'ASC');
    return qb.getMany();
  }

  async findById(id: string): Promise<Template> {
    const t = await this.repo.findOne({ where: { id } });
    if (!t) throw new NotFoundException(`Шаблон ${id} не знайдено`);
    return t;
  }

  // ── Побудова блоків сторінки із шаблону ──────────────────────────────────

  buildBlocks(template: Template, input: BuildBlocksInput): any[] {
    const { content, city, power, audience, customFields = {} } = input;
    const c = content as any;

    return template.structure.blocks
      .sort((a, b) => a.order - b.order)
      .map(blockDef => {
        const data = this.resolveBlockData(blockDef, c, { city, power, audience, customFields });
        return { type: blockDef.type, order: blockDef.order, data };
      });
  }

  private resolveBlockData(
    def: TemplateBlockDef,
    content: any,
    vars: { city?: string; power?: number; audience?: 'home' | 'business'; customFields: Record<string, string> },
  ): Record<string, unknown> {
    const { city, power, audience, customFields } = vars;

    const applyCustomFields = (value: string): string =>
      Object.entries(customFields).reduce(
        (result, [k, v]) => result.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v),
        value,
      );

    const replace = (str: string): string =>
      applyCustomFields(
        str
          .replace(/\{\{city\}\}/g,     city    ?? 'Україна')
          .replace(/\{\{power\}\}/g,    power ? `${power}` : '')
          .replace(/\{\{audience\}\}/g, audience === 'business' ? 'бізнесу' : 'дому'),
      );

    switch (def.type) {
      case 'hero':
        return {
          title:    replace(content.hero?.title    ?? def.defaults['title'] as string ?? ''),
          subtitle: replace(content.hero?.subtitle ?? def.defaults['subtitle'] as string ?? ''),
          cta:      content.cta?.main ?? 'Розрахувати станцію безкоштовно',
          subtext: 'Відповімо за 30 хвилин. Без зобов\'язань. Безкоштовний виїзд',
        };

      case 'pain':
        return {
          title: 'Чому клієнти приходять до нас',
          items: content.pain_blocks ?? def.defaults['items'] ?? [],
        };

      case 'steps':
        return {
          title: 'Від дзвінка до власної електростанції — 4 кроки',
          items: content.steps ?? [],
        };

      case 'numbers':
        return { items: content.numbers ?? [] };

      case 'audience':
        return {
          home:     content.audience?.home ?? '',
          business: content.audience?.business ?? '',
          show:     audience ?? 'both',
        };

      case 'guarantees':
        return { items: content.guarantees ?? [] };

      case 'offers':
        const offer = audience === 'business'
          ? content.offers?.business
          : content.offers?.home;
        return { offer: offer ?? content.offers?.home ?? {}, city };

      case 'cta':
        return {
          title:  replace('Готові забути про відключення{{city}}?'.replace('{{city}}', city ? ` у ${city}` : '')),
          text:   content.cta?.text  ?? 'Залиште номер — розрахуємо безкоштовно',
          button: content.cta?.main  ?? 'Хочу безкоштовний розрахунок',
          subtext: '📞 Відповідаємо щодня з 8:00 до 20:00 · Львів та вся Україна',
        };

      case 'faq':
        return { items: content.faq ?? def.defaults['items'] ?? [] };

      default:
        return { ...def.defaults, ...customFields };
    }
  }

  // ── Seed 11 шаблонів Solomiya Energy ──────────────────────────────────────

  private async seedSolomiyaTemplates() {
    this.logger.log('Seeding Solomiya Energy templates...');

    const STANDARD_BLOCKS: TemplateBlockDef[] = [
      { type: 'hero',       order: 1, required: true,  defaults: {} },
      { type: 'pain',       order: 2, required: true,  defaults: {} },
      { type: 'steps',      order: 3, required: true,  defaults: {} },
      { type: 'numbers',    order: 4, required: false, defaults: {} },
      { type: 'audience',   order: 5, required: false, defaults: {} },
      { type: 'guarantees', order: 6, required: true,  defaults: {} },
      { type: 'cta',        order: 7, required: true,  defaults: {} },
    ];

    const WITH_OFFERS: TemplateBlockDef[] = [
      ...STANDARD_BLOCKS.slice(0, 6),
      { type: 'offers', order: 6, required: false, defaults: {} },
      { type: 'cta',    order: 7, required: true,  defaults: {} },
    ];

    const templates = [
      {
        name:        'Головна сторінка',
        description: 'Шаблон для головної сторінки solomiya-energy.com',
        category:    'home',
        tags:        ['home', 'main', 'landing'],
        isGlobal:    true,
        structure: {
          blocks: [
            { type: 'hero',       order: 1, required: true,  defaults: { title: 'Світло є. Навіть коли його немає.' } },
            { type: 'pain',       order: 2, required: true,  defaults: {} },
            { type: 'steps',      order: 3, required: true,  defaults: {} },
            { type: 'numbers',    order: 4, required: true,  defaults: {} },
            { type: 'audience',   order: 5, required: true,  defaults: {} },
            { type: 'offers',     order: 6, required: false, defaults: {} },
            { type: 'guarantees', order: 7, required: true,  defaults: {} },
            { type: 'cta',        order: 8, required: true,  defaults: {} },
          ],
          seoRules:    { includeCity: false, includeBrand: true },
          requiredVars: [],
        },
      },
      {
        name:        'СЕС для дому',
        description: 'Сторінка для приватних будинків',
        category:    'home',
        tags:        ['home', 'residential', 'house'],
        isGlobal:    true,
        structure: {
          blocks: STANDARD_BLOCKS,
          seoRules: { includeCity: true, includeAudience: true },
          requiredVars: [],
        },
      },
      {
        name:        'СЕС для бізнесу',
        description: 'Сторінка для комерційних клієнтів',
        category:    'business',
        tags:        ['business', 'commercial', 'b2b'],
        isGlobal:    true,
        structure: {
          blocks: WITH_OFFERS,
          seoRules: { includeCity: true, includeAudience: true },
          requiredVars: [],
        },
      },
      {
        name:        'СЕС 5 кВт',
        description: 'Сторінка для станцій потужністю 5 кВт',
        category:    'power',
        tags:        ['5kwt', 'small', 'home'],
        isGlobal:    true,
        structure: {
          blocks: STANDARD_BLOCKS,
          seoRules: { includePower: true, includeCity: true },
          requiredVars: ['power'],
        },
      },
      {
        name:        'СЕС 10 кВт',
        description: 'Сторінка для станцій потужністю 10 кВт',
        category:    'power',
        tags:        ['10kwt', 'medium', 'home'],
        isGlobal:    true,
        structure: {
          blocks: STANDARD_BLOCKS,
          seoRules: { includePower: true, includeCity: true },
          requiredVars: ['power'],
        },
      },
      {
        name:        'СЕС 20 кВт',
        description: 'Сторінка для станцій потужністю 20 кВт',
        category:    'power',
        tags:        ['20kwt', 'medium', 'business'],
        isGlobal:    true,
        structure: {
          blocks: WITH_OFFERS,
          seoRules: { includePower: true, includeCity: true },
          requiredVars: ['power'],
        },
      },
      {
        name:        'СЕС 30 кВт',
        description: 'Сторінка для станцій потужністю 30 кВт',
        category:    'power',
        tags:        ['30kwt', 'large', 'business'],
        isGlobal:    true,
        structure: {
          blocks: WITH_OFFERS,
          seoRules: { includePower: true, includeCity: true },
          requiredVars: ['power'],
        },
      },
      {
        name:        'СЕС 50 кВт',
        description: 'Сторінка для станцій потужністю 50 кВт',
        category:    'power',
        tags:        ['50kwt', 'industrial', 'business'],
        isGlobal:    true,
        structure: {
          blocks: WITH_OFFERS,
          seoRules: { includePower: true, includeCity: true },
          requiredVars: ['power'],
        },
      },
      {
        name:        'SEO-сторінка під місто',
        description: 'Локальна SEO сторінка — підставляється місто',
        category:    'seo_city',
        tags:        ['seo', 'geo', 'local', 'city'],
        isGlobal:    true,
        structure: {
          blocks: [
            { type: 'hero',       order: 1, required: true,  defaults: { title: 'Сонячна електростанція у {{city}}' } },
            { type: 'pain',       order: 2, required: true,  defaults: {} },
            { type: 'steps',      order: 3, required: false, defaults: {} },
            { type: 'numbers',    order: 4, required: false, defaults: {} },
            { type: 'guarantees', order: 5, required: true,  defaults: {} },
            { type: 'faq',        order: 6, required: false, defaults: { items: [] } },
            { type: 'cta',        order: 7, required: true,  defaults: {} },
          ],
          seoRules:    { includeCity: true, cityRequired: true },
          requiredVars: ['city'],
        },
      },
      {
        name:        'Сезонна акція',
        description: 'Лімітований оффер / акційна пропозиція',
        category:    'seasonal',
        tags:        ['promo', 'seasonal', 'offer', 'limited'],
        isGlobal:    true,
        structure: {
          blocks: [
            { type: 'hero',       order: 1, required: true,  defaults: { title: 'Літо — найкращий час для монтажу' } },
            { type: 'offers',     order: 2, required: true,  defaults: {} },
            { type: 'steps',      order: 3, required: false, defaults: {} },
            { type: 'guarantees', order: 4, required: true,  defaults: {} },
            { type: 'cta',        order: 5, required: true,  defaults: { button: 'Забронювати дату монтажу' } },
          ],
          seoRules:    { includeSeason: true },
          requiredVars: [],
        },
      },
      {
        name:        'B2B сторінка',
        description: 'Корпоративним клієнтам: виробництва, магазини, офіси',
        category:    'b2b',
        tags:        ['b2b', 'corporate', 'business', 'industrial'],
        isGlobal:    true,
        structure: {
          blocks: [
            { type: 'hero',       order: 1, required: true,  defaults: { title: 'Промислові сонячні станції для бізнесу' } },
            { type: 'pain',       order: 2, required: true,  defaults: {} },
            { type: 'audience',   order: 3, required: true,  defaults: { show: 'business' } },
            { type: 'numbers',    order: 4, required: true,  defaults: {} },
            { type: 'offers',     order: 5, required: true,  defaults: {} },
            { type: 'guarantees', order: 6, required: true,  defaults: {} },
            { type: 'cta',        order: 7, required: true,  defaults: { button: 'Отримати комерційну пропозицію' } },
          ],
          seoRules:    { includeAudience: true, audience: 'business' },
          requiredVars: [],
        },
      },
    ];

    for (const t of templates) {
      const entity = this.repo.create(t as Partial<Template>);
      await this.repo.save(entity);
    }

    this.logger.log(`✅ Seeded ${templates.length} Solomiya Energy templates`);
  }

  private async tableExists(tableName: string): Promise<boolean> {
    const [result] = await this.repo.query(
      'SELECT to_regclass(current_schema() || \'.\' || $1) AS regclass',
      [tableName],
    );

    return Boolean(result?.regclass);
  }
}
