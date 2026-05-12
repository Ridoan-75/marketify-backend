import { z } from "zod";

export const startConversationSchema = z.object({
  body: z.object({
    sellerId: z.string().min(1, "Seller ID is required"),
    productId: z.string().optional(),
    message: z.string().min(1, "Message is required"),
  }),
});

export const sendMessageSchema = z.object({
  body: z.object({
    content: z.string().min(1, "Message content is required"),
    type: z.enum(["TEXT", "IMAGE", "FILE", "PRODUCT_LINK"]).default("TEXT"),
  }),
});

export type StartConversationInput = z.infer<
  typeof startConversationSchema
>["body"];
export type SendMessageInput = z.infer<typeof sendMessageSchema>["body"];
