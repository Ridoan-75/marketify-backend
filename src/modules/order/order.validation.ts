import { z } from "zod";

export const placeOrderSchema = z.object({
  body: z.object({
    addressId: z.string().min(1, "Address is required"),
    note: z.string().optional(),
    paymentMethod: z.enum(["STRIPE", "COD"]),
  }),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum([
      "CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
    ]),
  }),
});

export const orderQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(10),
    status: z
      .enum([
        "PENDING",
        "CONFIRMED",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
        "RETURN_REQUESTED",
        "RETURNED",
        "REFUNDED",
      ])
      .optional(),
  }),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>["body"];
export type UpdateOrderStatusInput = z.infer<
  typeof updateOrderStatusSchema
>["body"];
export type OrderQueryInput = z.infer<typeof orderQuerySchema>["query"];
