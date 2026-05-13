import { z } from "zod";

export const generateDescriptionSchema = z.object({
  body: z.object({
    productName: z.string().min(2),
    category: z.string().min(2),
    keyFeatures: z.array(z.string()).min(1),
    targetAudience: z.string().optional(),
    tone: z.enum(["professional", "casual", "enthusiastic"]).optional(),
  }),
});

export const pricingSuggestionSchema = z.object({
  body: z.object({
    productName: z.string().min(2),
    category: z.string().min(2),
    condition: z.string().optional(),
    competitorPrices: z.array(z.number()).optional(),
    costPrice: z.number().optional(),
  }),
});

export const smartSearchSchema = z.object({
  query: z.object({
    q: z.string().min(1, "Search query is required"),
  }),
});

export const chatbotSchema = z.object({
  body: z.object({
    message: z.string().min(1),
    history: z
      .array(
        z.object({
          role: z.enum(["user", "model"]),
          text: z.string(),
        }),
      )
      .optional()
      .default([]),
  }),
});

export const analyzeReviewSchema = z.object({
  params: z.object({
    reviewId: z.string().min(1),
  }),
});
