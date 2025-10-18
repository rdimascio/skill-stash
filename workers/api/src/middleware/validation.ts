import { z } from 'zod';
import type { Context } from 'hono';
import { ValidationError } from './error-handler';

export const pluginSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().min(10).max(500),
  repoUrl: z.string().url(),
  author: z.string().min(1),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const pluginUpdateSchema = z.object({
  name: z.string().min(3).max(50).optional(),
  description: z.string().min(10).max(500).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const searchSchema = z.object({
  q: z.string().optional(),
  tag: z.string().optional(),
  tags: z.string().optional(), // Will be parsed as JSON array
  author: z.string().optional(),
  sort: z.enum(['stars', 'downloads', 'created', 'updated'] as const).optional(),
  order: z.enum(['asc', 'desc'] as const).optional(),
  limit: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
  offset: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined)
});

export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return async (c: Context, next: () => Promise<void>) => {
    try {
      const body = await c.req.json();
      const result = schema.safeParse(body);

      if (!result.success) {
        throw new ValidationError('Validation failed', result.error.issues);
      }

      c.set('validatedBody', result.data);
      await next();
    } catch (err) {
      if (err instanceof ValidationError) {
        throw err;
      }
      throw new ValidationError('Invalid request body');
    }
  };
}

export function validateQuery<T extends z.ZodTypeAny>(schema: T) {
  return async (c: Context, next: () => Promise<void>) => {
    const query = c.req.query();
    const result = schema.safeParse(query);

    if (!result.success) {
      throw new ValidationError('Invalid query parameters', result.error.issues);
    }

    c.set('validatedQuery', result.data);
    await next();
  };
}
