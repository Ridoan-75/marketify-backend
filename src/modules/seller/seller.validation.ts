import { z } from "zod";

export const sellerRegisterSchema = z.object({
  body: z.object({
    shopName: z.string().min(3, "Shop name must be at least 3 characters"),
    shopDescription: z.string().optional(),
    shopPhone: z.string().min(11).optional(),
    shopEmail: z.string().email().optional(),
    shopAddress: z.string().optional(),
  }),
});

export const updateShopSchema = z.object({
  body: z.object({
    shopName: z.string().min(3).optional(),
    shopDescription: z.string().optional(),
    shopPhone: z.string().optional(),
    shopEmail: z.string().email().optional(),
    shopAddress: z.string().optional(),
  }),
});

export type SellerRegisterInput = z.infer<typeof sellerRegisterSchema>["body"];
export type UpdateShopInput = z.infer<typeof updateShopSchema>["body"];
