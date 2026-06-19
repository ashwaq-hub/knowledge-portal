import { defineCollection, z } from 'astro:content';

const entryCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    date_created: z.date(),
    date_updated: z.date().optional(),
    life_stage: z.array(z.string()).default([]),
    related: z.array(z.string()).default([]),
    people_mentioned: z.array(z.string()).default([]),
    media: z.array(z.string()).default([]),
    maturity: z.enum(['draft', 'reviewed', 'final']).default('draft'),
    priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    excerpt: z.string().optional(),
  }),
});

export const collections = {
  entries: entryCollection,
};
