import { z } from "zod";

export const createCouponSchema = z.object({
  body: z.object({
    code: z.string().min(3).max(20).toUpperCase(),
    type: z.enum(["PERCENTAGE", "FIXED"]),
    value: z.coerce.number().positive(),
    minOrderAmount: z.coerce.number().positive().optional(),
    maxDiscount: z.coerce.number().positive().optional(),
    usageLimit: z.coerce.number().int().positive().optional(),
    isActive: z.boolean().default(true),
    startsAt: z.coerce.date().optional(),
    expiresAt: z.coerce.date().optional(),
  }),
});

export const updateCouponSchema = z.object({
  body: z.object({
    value: z.coerce.number().positive().optional(),
    minOrderAmount: z.coerce.number().positive().optional(),
    maxDiscount: z.coerce.number().positive().optional(),
    usageLimit: z.coerce.number().int().positive().optional(),
    isActive: z.boolean().optional(),
    startsAt: z.coerce.date().optional(),
    expiresAt: z.coerce.date().optional(),
  }),
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>["body"];
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>["body"];
