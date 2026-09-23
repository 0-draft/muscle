import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const knowledge = defineCollection({
  loader: glob({ pattern: '*/*.md', base: './knowledge' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    area: z.enum(['training', 'nutrition', 'recovery', 'adherence']),
    order: z.number(),
    last_reviewed: z.coerce.date(),
  }),
});

const program = defineCollection({
  loader: glob({ pattern: '*/*.md', base: './program' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    valid_from: z.coerce.date(),
  }),
});

export const collections = { knowledge, program };
