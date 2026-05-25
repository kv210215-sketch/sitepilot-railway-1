import { z } from 'zod';

export const EV_JSONLD_VERSION = '1' as const;

export const EV_JSONLD_FIELD_KEYS = [
  'graph',
  'localBusiness',
  'faqPage',
  'knownDriftRisks',
] as const;

export const JsonLdEntitySchema = z.object({
  type: z.string(),
  idPattern: z.string().optional(),
  requiredFields: z.array(z.string()),
});

export const FaqQuestionSchema = z.object({
  index: z.number().int().positive(),
  questionSummary: z.string(),
});

/**
 * EV_JSONLD — structured data parity surface (homepage @graph).
 */
export const EvJsonLdSchema = z.object({
  version: z.literal(EV_JSONLD_VERSION),
  graph: z.object({
    entityCount: z.number().int().positive(),
    types: z.array(z.string()),
  }),
  localBusiness: JsonLdEntitySchema,
  faqPage: z.object({
    entity: JsonLdEntitySchema,
    questionCount: z.number().int().positive(),
    questions: z.array(FaqQuestionSchema),
  }),
  knownDriftRisks: z.array(z.string()),
});

export type EvJsonLdShape = z.infer<typeof EvJsonLdSchema>;

export function createEvJsonLdSpecTemplate(): EvJsonLdShape {
  return EvJsonLdSchema.parse({
    version: EV_JSONLD_VERSION,
    graph: {
      entityCount: 2,
      types: ['LocalBusiness', 'FAQPage'],
    },
    localBusiness: {
      type: 'LocalBusiness',
      idPattern: '{origin}/#business',
      requiredFields: [
        '@type',
        '@id',
        'name',
        'description',
        'url',
        'telephone',
        'email',
        'foundingDate',
        'image',
        'priceRange',
        'address',
        'openingHoursSpecification',
        'areaServed',
        'aggregateRating',
      ],
    },
    faqPage: {
      entity: {
        type: 'FAQPage',
        requiredFields: ['@type', 'mainEntity'],
      },
      questionCount: 6,
      questions: [
        { index: 1, questionSummary: 'Скільки коштує сонячна станція?' },
        { index: 2, questionSummary: 'Чи потрібен дозвіл на встановлення?' },
        { index: 3, questionSummary: 'Що буде з електрикою взимку?' },
        { index: 4, questionSummary: 'Як швидко окупиться станція?' },
        { index: 5, questionSummary: 'Чи можна продавати електрику в мережу?' },
        { index: 6, questionSummary: 'Яке обслуговування потрібне?' },
      ],
    },
    knownDriftRisks: [
      'faq-winter-batteries-html-vs-jsonld',
      'faq-payback-extra-sentence-html',
    ],
  });
}
