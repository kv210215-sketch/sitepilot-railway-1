import { z } from 'zod';

const ParityVectorSchema = z.enum(['runtime', 'seo', 'jsonld']);

const EndpointRefSchema = z.object({
  label: z.string().min(1),
  origin: z.string().url().nullable(),
  docRef: z.string().optional(),
});

/**
 * Parity harness configuration (P1).
 * `liveMode` defaults to false — collectors must not run until P2+ with explicit opt-in.
 */
export const ParityConfigSchema = z.object({
  version: z.literal('1'),
  liveMode: z.boolean().default(false),
  /** GET timeout for live collectors (ms). Ignored when liveMode=false. */
  collectTimeoutMs: z.number().int().positive().max(120_000).default(15_000),
  vectors: z.array(ParityVectorSchema).min(1),
  baseline: EndpointRefSchema,
  target: EndpointRefSchema,
  reportDir: z.string().default('reports'),
  notes: z.string().optional(),
});

export type ParityConfig = z.infer<typeof ParityConfigSchema>;
export type ParityVector = z.infer<typeof ParityVectorSchema>;
