import { Injectable, Logger } from '@nestjs/common';
import {
  GenerateSiteDto, GeneratedSiteDto, GeneratedPageDto, GeneratedBlockDto,
  ChatMessageDto, ChatResponseDto, ProposalDto,
  SiteType, BudgetRange, SiteGoal,
} from './ai.dto';

interface ConversationState {
  stage:       'qualify' | 'calculate' | 'close' | 'book';
  clientType?: SiteType;
  city?:       string;
  powerKw?:    number;
  consumption?: number;
  messages:    Array<{ role: 'user' | 'assistant'; content: string }>;
  createdAt:   Date;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly conversations = new Map<string, ConversationState>();

  // ── Site Generator ────────────────────────────────────────────────────────

  async generateSite(dto: GenerateSiteDto): Promise<GeneratedSiteDto> {
    this.logger.log(`Generating site: type=${dto.type} budget=${dto.budget} goal=${dto.goal}`);

    const city         = dto.city ?? 'Україна';
    const companyName  = dto.companyName ?? 'Solomiya Energy';
    const powerKw      = dto.powerKw ?? this.budgetToPower(dto.budget);
    const isHome       = dto.type === SiteType.HOME;

    const projectName = isHome
      ? `СЕС для дому — ${city}`
      : `Промислові СЕС для бізнесу — ${city}`;

    const slug = this.slugify(projectName);

    const pages: GeneratedPageDto[] = [
      this.buildMainPage(dto, city, powerKw, companyName),
      this.buildServicesPage(dto, city, powerKw),
      this.buildCasesPage(dto, city),
      this.buildContactPage(city, companyName),
    ];

    if (dto.goal === SiteGoal.LEADS || dto.goal === SiteGoal.SELL_DIRECT) {
      pages.push(this.buildCalculatorPage(city, powerKw, isHome));
    }

    return {
      projectName,
      slug,
      description:  `AI-згенерований сайт для ${companyName} — ${city}. Мета: ${dto.goal}.`,
      pages,
      seoStrategy:  this.buildSeoStrategy(dto, city, powerKw),
      ctaStrategy:  this.buildCtaStrategy(dto),
    };
  }

  // ── Sales Agent ───────────────────────────────────────────────────────────

  async chat(dto: ChatMessageDto): Promise<ChatResponseDto> {
    const convId = dto.conversationId ?? this.generateId();

    let conv = this.conversations.get(convId);
    if (!conv) {
      conv = {
        stage:      'qualify',
        clientType: dto.clientType,
        city:       dto.city,
        messages:   [],
        createdAt:  new Date(),
      };
      this.conversations.set(convId, conv);
    }

    conv.messages.push({ role: 'user', content: dto.message });

    const { reply, nextStage, proposal } = this.processMessage(dto.message, conv);

    conv.stage = nextStage;
    conv.messages.push({ role: 'assistant', content: reply });

    // Clean up old conversations (> 1 hour)
    const oneHourAgo = new Date(Date.now() - 3_600_000);
    for (const [id, c] of this.conversations.entries()) {
      if (c.createdAt < oneHourAgo) this.conversations.delete(id);
    }

    return {
      reply,
      conversationId: convId,
      stage:          nextStage,
      proposal,
      quickReplies:   this.getQuickReplies(nextStage, conv),
    };
  }

  // ── Private — Site Builder ────────────────────────────────────────────────

  private buildMainPage(dto: GenerateSiteDto, city: string, powerKw: number, company: string): GeneratedPageDto {
    const isHome = dto.type === SiteType.HOME;
    const title  = isHome
      ? `Сонячна електростанція ${powerKw} кВт для дому — ${city}`
      : `Промислова СЕС ${powerKw} кВт для бізнесу — ${city}`;

    const blocks: GeneratedBlockDto[] = [
      {
        type: 'hero', order: 1,
        data: {
          title:    isHome ? `Світло є. Навіть коли його немає.` : `Ваш бізнес більше не залежить від відключень`,
          subtitle: isHome
            ? `Сонячна станція ${powerKw} кВт для дому у ${city}. Монтаж за 1 день. Гарантія 25 років.`
            : `СЕС ${powerKw} кВт для бізнесу у ${city}. Окупність 2–4 роки. Економія 70–90%.`,
          cta:     isHome ? 'Розрахувати мою станцію безкоштовно' : 'Отримати комерційну пропозицію',
          subtext: 'Відповідаємо за 30 хвилин. Без зобов\'язань.',
        },
      },
      {
        type: 'pain', order: 2,
        data: {
          title: isHome ? 'Чому клієнти обирають сонячну станцію' : 'Чому бізнес переходить на сонячну енергію',
          items: isHome
            ? [
                { problem: '🔴 Відключення по 8–12 годин', solution: '✅ Живлення 24/7' },
                { problem: '🔴 Рахунки зростають', solution: '✅ Економія 70–90%' },
                { problem: '🔴 Залежність від мережі', solution: '✅ Повна автономність' },
              ]
            : [
                { problem: '🔴 Зупинки виробництва через відключення', solution: '✅ Безперервна робота' },
                { problem: '🔴 Витрати на електрику ростуть', solution: '✅ Окупність за 2–4 роки' },
                { problem: '🔴 Генератор — шум і витрати', solution: '✅ Тиха чиста енергія' },
              ],
        },
      },
      { type: 'steps',   order: 3, data: {} },
      { type: 'numbers', order: 4, data: {} },
      { type: 'guarantees', order: 5, data: {} },
      {
        type: 'cta', order: 6,
        data: {
          title:  isHome ? `Готові забути про відключення у ${city}?` : `Скільки втрачає ваш бізнес щомісяця?`,
          text:   isHome ? 'Залишіть номер — розрахуємо безкоштовно' : 'Надішлемо КП за 24 години',
          button: isHome ? 'Хочу безкоштовний розрахунок' : 'Отримати КП',
        },
      },
    ];

    return { title, slug: 'home', description: `Головна сторінка — ${title}`, purpose: 'main-landing', blocks };
  }

  private buildServicesPage(dto: GenerateSiteDto, city: string, powerKw: number): GeneratedPageDto {
    const isHome = dto.type === SiteType.HOME;
    const title  = isHome ? `Послуги монтажу СЕС у ${city}` : `B2B послуги — промислові СЕС у ${city}`;

    return {
      title,
      slug:        'services',
      description: `Сторінка послуг`,
      purpose:     'services',
      blocks: [
        { type: 'hero',       order: 1, data: { title, subtitle: `Від розрахунку до запуску за 7 днів` } },
        { type: 'offers',     order: 2, data: { audience: isHome ? 'home' : 'business' } },
        { type: 'steps',      order: 3, data: {} },
        { type: 'guarantees', order: 4, data: {} },
        { type: 'cta',        order: 5, data: { button: 'Замовити консультацію' } },
      ],
    };
  }

  private buildCasesPage(dto: GenerateSiteDto, city: string): GeneratedPageDto {
    return {
      title:       `Наші проєкти — СЕС у ${city}`,
      slug:        'cases',
      description: 'Реалізовані проєкти',
      purpose:     'social-proof',
      blocks: [
        { type: 'hero',    order: 1, data: { title: `500+ успішних проєктів СЕС`, subtitle: `Реальні результати наших клієнтів у ${city}` } },
        { type: 'numbers', order: 2, data: {} },
        { type: 'cta',     order: 3, data: { button: 'Стати наступним' } },
      ],
    };
  }

  private buildContactPage(city: string, company: string): GeneratedPageDto {
    return {
      title:       `Контакти — ${company} у ${city}`,
      slug:        'contacts',
      description: 'Контактна сторінка',
      purpose:     'contact',
      blocks: [
        { type: 'hero', order: 1, data: { title: 'Зв\'яжіться з нами', subtitle: `Безкоштовна консультація та виїзд інженера у ${city}` } },
        { type: 'cta',  order: 2, data: { button: 'Подзвонити зараз', title: 'Відповідаємо з 8:00 до 20:00' } },
      ],
    };
  }

  private buildCalculatorPage(city: string, powerKw: number, isHome: boolean): GeneratedPageDto {
    return {
      title:       `Калькулятор окупності СЕС — ${city}`,
      slug:        'calculator',
      description: 'Онлайн-калькулятор',
      purpose:     'lead-gen',
      blocks: [
        {
          type: 'hero', order: 1,
          data: { title: 'Дізнайтесь скільки ви заощадите', subtitle: 'Безкоштовний розрахунок за 2 хвилини' },
        },
        {
          type: 'cta', order: 2,
          data: {
            title:  'Залиште контакт — надішлемо детальний розрахунок',
            button: 'Розрахувати',
            hint:   `Середня окупність: 3–5 років. Після цього — 20+ років безкоштовної електрики.`,
          },
        },
      ],
    };
  }

  // ── Private — Chat ────────────────────────────────────────────────────────

  private processMessage(
    message: string,
    conv: ConversationState,
  ): { reply: string; nextStage: ConversationState['stage']; proposal?: ProposalDto } {
    const lc = message.toLowerCase();

    if (conv.stage === 'qualify') {
      if (lc.includes('дім') || lc.includes('дом') || lc.includes('будинок')) {
        conv.clientType = SiteType.HOME;
      } else if (lc.includes('бізнес') || lc.includes('офіс') || lc.includes('завод')) {
        conv.clientType = SiteType.BUSINESS;
      }

      const powerMatch = message.match(/(\d+)\s*(квт|kw|кВт)/i);
      if (powerMatch) conv.powerKw = parseInt(powerMatch[1]);

      const consumptionMatch = message.match(/(\d+)\s*(квт.?год|kwh)/i);
      if (consumptionMatch) conv.consumption = parseInt(consumptionMatch[1]);

      if (conv.clientType && (conv.powerKw || conv.consumption)) {
        const power = conv.powerKw ?? Math.ceil((conv.consumption ?? 500) / 1200 * 10);
        const proposal = this.buildProposal(power, conv.clientType);
        return {
          reply: this.buildCalculateReply(power, proposal, conv),
          nextStage: 'close',
          proposal,
        };
      }

      return {
        reply:      this.buildQualifyReply(conv),
        nextStage:  'qualify',
      };
    }

    if (conv.stage === 'calculate' || conv.stage === 'close') {
      if (lc.includes('так') || lc.includes('погоджую') || lc.includes('хочу') || lc.includes('записати')) {
        return {
          reply:     `Чудово! Залиште ваш номер телефону і наш інженер зателефонує вам протягом 30 хвилин для уточнення деталей. Виїзд безкоштовний! 📞`,
          nextStage: 'book',
        };
      }

      if (lc.includes('дорого') || lc.includes('ціна')) {
        return {
          reply:     `Розумію. Але давайте порахуємо: якщо зараз платите ~2000–4000 грн/місяць за електрику, то за 3–5 років станція повністю окупиться, а далі — 20 років безкоштовної електрики. Це вигідно навіть фінансово. Хочете отримати точний розрахунок для вашого об'єкту? 💡`,
          nextStage: 'close',
        };
      }

      return {
        reply:     `Якщо є питання — з радістю відповім! Готові записатися на безкоштовний виїзд інженера? 🏠`,
        nextStage: 'close',
      };
    }

    return {
      reply:     `Дякуємо за інтерес! Наш менеджер зв'яжеться з вами найближчим часом. Гарного дня! ☀️`,
      nextStage: 'book',
    };
  }

  private buildQualifyReply(conv: ConversationState): string {
    if (!conv.clientType) {
      return `Добрий день! Я допоможу підібрати сонячну станцію саме для вас 😊\n\nСкажіть: станція потрібна для *дому* чи *бізнесу*?`;
    }
    return `Зрозумів! ${conv.clientType === SiteType.HOME ? 'Для дому' : 'Для бізнесу'} — чудовий вибір 💡\n\nПідкажіть: яке зараз середнє споживання електрики на місяць (у кВт·год) або яку потужність розглядаєте?`;
  }

  private buildCalculateReply(power: number, proposal: ProposalDto, conv: ConversationState): string {
    return `На основі ваших даних ось орієнтовний розрахунок:\n\n` +
      `⚡ Рекомендована потужність: **${power} кВт**\n` +
      `💰 Орієнтовна вартість: ${proposal.estimatedCost}\n` +
      `📅 Окупність: ${proposal.paybackYears} роки\n` +
      `💸 Економія на місяць: ${proposal.monthlySaving}\n` +
      `📈 Економія на рік: ${proposal.annualSaving}\n\n` +
      `Хочете отримати точний розрахунок і безкоштовний виїзд інженера? 🏠`;
  }

  private buildProposal(powerKw: number, type: SiteType): ProposalDto {
    const pricePerKw = type === SiteType.BUSINESS ? 30_000 : 35_000;
    const totalCost  = powerKw * pricePerKw;
    const annualGen  = powerKw * 1_100; // ~1100 kWh/kW/year in Ukraine
    const tariff     = 4.32; // UAH per kWh
    const annualSave = Math.round(annualGen * tariff);

    return {
      powerKw,
      estimatedCost: `${(totalCost / 1000).toFixed(0)} 000 грн`,
      paybackYears:  Math.round(totalCost / annualSave),
      monthlySaving: `${Math.round(annualSave / 12).toLocaleString()} грн`,
      annualSaving:  `${annualSave.toLocaleString()} грн`,
    };
  }

  private getQuickReplies(stage: ConversationState['stage'], conv: ConversationState): string[] {
    if (stage === 'qualify' && !conv.clientType) {
      return ['Для дому 🏠', 'Для бізнесу 🏭'];
    }
    if (stage === 'qualify') {
      return ['5 кВт', '10 кВт', '20 кВт', '500 кВт·год/місяць'];
    }
    if (stage === 'close') {
      return ['Так, записати виїзд ✅', 'Скільки це коштує?', 'Хочу більше деталей'];
    }
    return [];
  }

  private buildSeoStrategy(dto: GenerateSiteDto, city: string, powerKw: number): string {
    return `Головна: "СЕС ${powerKw} кВт ${dto.type === SiteType.HOME ? 'для дому' : 'для бізнесу'} ${city}". ` +
      `Дочірні сторінки під кожну потужність (5/10/20/30/50 кВт) та тип клієнта. ` +
      `FAQ блок під low-competition запити. Schema.org LocalBusiness markup.`;
  }

  private buildCtaStrategy(dto: GenerateSiteDto): string {
    return dto.goal === SiteGoal.LEADS
      ? 'Квіз-калькулятор → телефон → виїзд інженера'
      : dto.goal === SiteGoal.SELL_DIRECT
        ? 'Прайс-листи → пакети → онлайн-замовлення'
        : 'Інформаційний контент → довіра → контакт';
  }

  private budgetToPower(budget: BudgetRange): number {
    const map: Record<BudgetRange, number> = {
      [BudgetRange.SMALL]:  5,
      [BudgetRange.MEDIUM]: 10,
      [BudgetRange.LARGE]:  30,
      [BudgetRange.XLARGE]: 50,
    };
    return map[budget];
  }

  private slugify(text: string): string {
    return text.toLowerCase()
      .replace(/[а-яіїєґ]/g, c => ({ 'а':'a','б':'b','в':'v','г':'h','д':'d','е':'e','є':'ye','ж':'zh','з':'z','и':'y','і':'i','ї':'yi','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ь':'','ю':'yu','я':'ya','ґ':'g' }[c] ?? c))
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 80);
  }

  private generateId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}
