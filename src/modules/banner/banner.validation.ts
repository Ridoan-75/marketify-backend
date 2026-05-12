import { z } from 'zod';

export const createBannerSchema = z.object({
  body: z.object({
    title: z.string().min(2),
    subtitle: z.string().optional(),
    link: z.string().url().optional(),
    position: z.enum(['HERO', 'MIDDLE', 'SIDEBAR', 'FOOTER']).default('HERO'),
    sortOrder: z.coerce.number().int().default(0),
    isActive: z.coerce.boolean().default(true),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().optional(),
  }),
});

export const updateBannerSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    subtitle: z.string().optional(),
    link: z.string().url().optional(),
    position: z.enum(['HERO', 'MIDDLE', 'SIDEBAR', 'FOOTER']).optional(),
    sortOrder: z.coerce.number().int().optional(),
    isActive: z.coerce.boolean().optional(),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().optional(),
  }),
});

export type CreateBannerInput = z.infer<typeof createBannerSchema>['body'];
export type UpdateBannerInput = z.infer<typeof updateBannerSchema>['body'];