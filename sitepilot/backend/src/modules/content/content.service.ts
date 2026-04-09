import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentBlock } from './content-block.entity';

export interface SolomiyaContent {
  utp:        { main: string; short: string; b2b: string };
  hero:       { title: string; subtitle: string };
  pain_blocks: Array<{ problem: string; solution: string }>;
  steps:      Array<{ title: string; description: string }>;
  numbers:    Array<{ value: string; label: string }>;
  audience:   { home: string; business: string };
  guarantees: string[];
  offers:     {
    home:     { title: string; items: string[]; cta: string };
    business: { title: string; items: string[]; cta: string };
    seasonal: { title: string; items: string[]; cta: string };
  };
  cta: {
    main:    string;
    text:    string;
    subtext: string;
  };
  faq:    Array<{ question: string; answer: string }>;
  ads:    { post1: string; post2: string; post3: string };
  script: { greeting: string; qualify: string[]; objections: Record<string, string> };
}

@Injectable()
export class ContentService implements OnModuleInit {
  private readonly logger = new Logger(ContentService.name);

  constructor(
    @InjectRepository(ContentBlock)
    private readonly repo: Repository<ContentBlock>,
  ) {}

  async onModuleInit() {
    const count = await this.repo.count();
    if (count === 0) await this.seedMarketingPack();
  }

  // ── Отримати весь контент (для генератора) ────────────────────────────────

  async getContentData(): Promise<SolomiyaContent> {
    const blocks = await this.repo.find({ where: { isActive: true } });
    const result: Record<string, unknown> = {};
    for (const b of blocks) {
      result[b.key] = b.data;
    }
    return result as unknown as SolomiyaContent;
  }

  async getBlock(key: string) {
    return this.repo.findOne({ where: { key } });
  }

  async updateBlock(key: string, data: Record<string, unknown>) {
    const block = await this.repo.findOne({ where: { key } });
    if (!block) return null;
    block.data = data;
    return this.repo.save(block);
  }

  // ── Seed маркетинг-пакету Solomiya Energy ─────────────────────────────────

  private async seedMarketingPack() {
    this.logger.log('Seeding Solomiya Energy marketing content...');

    const pack: Record<string, unknown> = {

      utp: {
        main:  'Сонячна станція під ключ за 7 днів — або повертаємо передоплату. Встановлюємо по всій Україні. Гарантія 25 років на панелі.',
        short: 'Забудьте про відключення. Назавжди.',
        b2b:   'Скоротіть витрати на електрику на 70–90% вже з першого місяця роботи.',
      },

      hero: {
        title:    'Світло є. Навіть коли його немає.',
        subtitle: 'Сонячні електростанції для дому та бізнесу у Львові та по всій Україні. Монтаж за 1 день. Окупність — від 3 років. Гарантія — 25 років.',
      },

      pain_blocks: [
        { problem: '🔴 Відключення по 8–12 годин',      solution: '✅ Живлення 24/7 без залежності від мережі' },
        { problem: '🔴 Рахунки зростають щомісяця',     solution: '✅ Економія 70–90% на електриці' },
        { problem: '🔴 Бізнес зупиняється без світла',  solution: '✅ Безперебійна робота обладнання' },
        { problem: '🔴 Генератор — шум, бензин, витрати', solution: '✅ Тихе, чисте, безкоштовне сонце' },
      ],

      steps: [
        { title: 'Заявка',           description: 'Залишіть контакт, ми телефонуємо за 30 хвилин' },
        { title: 'Виїзд і розрахунок', description: 'Інженер безкоштовно оцінює об\'єкт і рахує економіку' },
        { title: 'Монтаж',           description: 'Команда встановлює станцію за 1 робочий день' },
        { title: 'Запуск',           description: 'Ви вже економите з першого сонячного дня' },
      ],

      numbers: [
        { value: '500+',    label: 'виконаних проєктів' },
        { value: '25 років', label: 'гарантія на панелі' },
        { value: 'від 3',   label: 'років середня окупність' },
        { value: '70–90%',  label: 'економія на електриці' },
        { value: '1 день',  label: 'середній час монтажу' },
      ],

      audience: {
        home:     'Живіть комфортно навіть під час відключень. Холодильник, котел, освітлення, роутер — все працює. Забудьте про свічки й павербанки.',
        business: 'Кожна година без світла — це прямі збитки. Ми рахуємо, скільки ви втрачаєте — і показуємо, як станція окупиться за 2–4 роки. Цифри говорять самі.',
      },

      guarantees: [
        '🛡 Офіційний дистриб\'ютор обладнання',
        '🛡 Договір із фіксованою ціною — без прихованих доплат',
        '🛡 Гарантія на монтаж — 5 років',
        '🛡 Гарантія на панелі — 25 років',
        '🛡 Сервісне обслуговування після встановлення',
      ],

      offers: {
        home: {
          title: 'Ваші сусіди вже в темряві. Ви — ні.',
          items: ['Монтаж за 1 день', 'Рахунки мінус 80%', 'Робота без відключень'],
          cta:   '🎁 Безкоштовний розрахунок + виїзд інженера — до кінця місяця',
        },
        business: {
          title: 'Скільки коштує 1 година без світла у вашому бізнесі?',
          items: ['Повністю покриває потреби виробництва / офісу / магазину', 'Окупиться за 2–4 роки', 'Пропрацює 25+ років'],
          cta:   'Отримати комерційну пропозицію за 24 години',
        },
        seasonal: {
          title: 'Літо — найкращий час для монтажу. Черга вже є.',
          items: ['Фіксована ціна в договорі', 'Безкоштовний моніторинг системи — 1 рік', 'Монтаж у зручний для вас день'],
          cta:   'Залишилось 8 вільних дат у цьому місяці',
        },
      },

      cta: {
        main:    'Розрахувати мою станцію безкоштовно',
        text:    'Залиште номер — ми розрахуємо вашу станцію безкоштовно і скажемо, скільки ви заощадите вже цього року.',
        subtext: '📞 Відповідаємо щодня з 8:00 до 20:00 · Львів та вся Україна',
      },

      faq: [
        { question: 'Скільки коштує сонячна станція?', answer: 'Ціна залежить від потужності і конфігурації. Базова станція 5 кВт — від 150 000 грн. Безкоштовний розрахунок за вашим об\'єктом.' },
        { question: 'Як швидко окупиться?',            answer: 'Середня окупність — 3–5 років. Після цього 20+ років станція працює безкоштовно.' },
        { question: 'Чи працює під час відключень?',   answer: 'Так, з акумуляторами — повна автономність. Без акумуляторів — живлення від сонця вдень.' },
        { question: 'Яка гарантія?',                   answer: '25 років на панелі, 5 років на монтаж. Офіційний договір з фіксованою ціною.' },
        { question: 'Скільки часу займає монтаж?',     answer: 'Стандартна станція — 1 робочий день. Великі промислові — 2–3 дні.' },
      ],

      ads: {
        post1: 'Ви знову сидите без світла. Холодильник розморожується. Дитина не може навчатися. Робота стоїть.\n\nІ так — по колу.\n\nМи в Solomiya Energy встановили вже 500+ сонячних станцій по всій Україні. Наші клієнти не знають, що таке відключення — вже рік, два, п\'ять.\n\nХочете так само?\n👇 Напишіть «РОЗРАХУНОК» у коментарі або тисніть на посилання — розрахуємо безкоштовно.\n\n#сонячнаенергія #сонячніпанелі #Львів #автономність #solomiyaenergy',
        post2: '«Перший рахунок після встановлення — 180 грн замість 2 400. Я плакала від радості» — Оксана, Львів, будинок 180 м²\n\nЦе не магія. Це фізика та правильно підібрана система.\n\nSolomiya Energy — сонячні станції під ключ.\n📍 Львів та вся Україна ⚡ Монтаж за 1 день 💰 Окупність від 3 років\n\n→ Посилання в шапці профілю',
        post3: 'Якщо ваш бізнес залежить від електрики — у вас є проблема. Якщо відключення тривають 6–10 годин — у вас є криза.\n\nМи вирішуємо це раз і назавжди.\n\nSolomiya Energy встановлює промислові сонячні станції для:\n☑ Виробництв і цехів\n☑ Магазинів і ресторанів\n☑ Офісів і складів\n☑ АЗС і готелів\n\nРезультат: автономність + економія 70–90% щомісяця.\n📩 Пишіть у Direct — надішлемо КП за 24 години.',
      },

      script: {
        greeting: 'Добрий день! Мене звати [Ім\'я], компанія Solomiya Energy. Ви залишили заявку на розрахунок сонячної станції — я вам телефоную. Вам зручно говорити зараз?',
        qualify: [
          'Це для будинку чи для бізнесу?',
          'Яка площа / яке споживання приблизно?',
          'У якому місті / районі знаходиться об\'єкт?',
          'Як довго вже думаєте про станцію?',
        ],
        objections: {
          'Дорого':             'Після виїзду інженер покаже точну цифру і рахунок окупності. Більшість клієнтів, які теж думали «дорого» — побачили, що станція окупається за 3–4 роки, а потім 20 років працює безкоштовно. Домовились на виїзд?',
          'Треба подумати':    'Що саме зупиняє — ціна, терміни, щось інше? Можливо, я можу відповісти прямо зараз.',
          'Зараз не на часі': 'Поки черга менша і ціни не виросли — найкращий момент зафіксувати умови. Розрахунок ні до чого не зобов\'язує.',
          'Вже дивились інших': 'Що вам запропонували — я поясню, чим наша пропозиція відрізняється. Фіксована ціна в договорі, монтаж за 1 день, гарантія 25 років.',
        },
      },
    };

    for (const [key, data] of Object.entries(pack)) {
      const entity = this.repo.create({
        key,
        name:     key,
        category: 'marketing',
        data:     data as Record<string, unknown>,
        isActive: true,
      });
      await this.repo.save(entity);
    }

    this.logger.log('✅ Solomiya Energy marketing pack seeded');
  }
}
