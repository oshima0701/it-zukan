import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const TYPE_KEYS = ['language', 'tool', 'ai', 'place', 'mechanism', 'data'] as const;

const source = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  url: z.string().url(),
  accessed: z.coerce.date(),
});

const zukan = defineCollection({
  loader: glob({ base: './src/content/zukan', pattern: '**/*.mdx' }),
  schema: z.object({
    no: z.number().int().positive(),
    name: z.string(),
    reading: z.string(),
    type: z.enum(TYPE_KEYS),
    oneLine: z.string(),
    surprise: z.string(),
    takeaway: z.string(),
    status: z.object({
      difficulty: z.number().int().min(1).max(5),
      popularity: z.number().int().min(1).max(5),
      breadth: z.number().int().min(1).max(5),
    }),
    order: z.number().int(),
    updated: z.coerce.date(),

    born: z.number().int().optional(),
    bornNote: z.string().optional(),
    creators: z.array(z.object({
      name: z.string(),
      nameEn: z.string().optional(),
      wikidata: z.string().optional(),
    })).optional(),
    birthplace: z.object({
      label: z.string(),
      lat: z.number().min(-90).max(90).optional(),
      lng: z.number().min(-180).max(180).optional(),
    }).optional(),
    mascot: z.object({ name: z.string(), origin: z.string().optional() }).optional(),
    officialUrl: z.string().url().optional(),
    aliases: z.array(z.string()).default([]),
    related: z.array(z.object({
      slug: z.string(),
      relation: z.enum(['partner', 'rival', 'ancestor', 'descendant']),
      note: z.string().optional(),
    })).default([]),
    sources: z.array(source).min(1),
    disputed: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

const events = defineCollection({
  loader: glob({ base: './src/content/events', pattern: '**/*.md' }),
  schema: z.object({
    year: z.number().int(),
    date: z.coerce.date().optional(),
    title: z.string(),
    kind: z.enum(['origin', 'incident', 'milestone']),
    summary: z.string(),
    lesson: z.string().optional(),
    related: z.array(z.string()).default([]),
    sources: z.array(source).min(1),
    updated: z.coerce.date(),
    draft: z.boolean().default(false),
  }).refine((d) => d.kind !== 'incident' || !!d.lesson, {
    message: 'kind が incident のときは lesson（教訓）が必要です',
    path: ['lesson'],
  }),
});

const notes = defineCollection({
  loader: glob({ base: './src/content/notes', pattern: '**/*.md' }),
  schema: z.object({
    category: z.enum(['aruaru', 'slang', 'kakugen', 'gokai', 'nihon', 'zatsugaku']),
    title: z.string(),
    truth: z.string().optional(),
    related: z.array(z.string()).default([]),
    sources: z.array(source).min(1),
    updated: z.coerce.date(),
    draft: z.boolean().default(false),
  }).refine((d) => d.category !== 'gokai' || !!d.truth, {
    message: 'category が gokai のときは truth（真実）が必要です',
    path: ['truth'],
  }),
});

export const collections = { zukan, events, notes };
