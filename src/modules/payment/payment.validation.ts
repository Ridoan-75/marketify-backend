import { z } from "zod";

export const initiatePaymentSchema = z.object({
  body: z.object({
    orderId: z.string().min(1, "Order ID is required"),
    method: z.enum(["STRIPE", "COD"], {
      error: "Payment method must be STRIPE or COD",
    }),
  }),
});
