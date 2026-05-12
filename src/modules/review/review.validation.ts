import { z } from 'zod';

export const createReviewSchema = z.object({
  body: z.object({
    productId: z.string().min(1, 'Product ID is required'),
    rating: z.coerce.number().int().min(1).max(5),
    comment: z.string().min(5).optional(),
  }),
});

export const updateReviewSchema = z.object({
  body: z.object({
    rating: z.coerce.number().int().min(1).max(5).optional(),
    comment: z.string().min(5).optional(),
  }),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>['body'];
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>['body'];