import { geminiModel } from "../../config/gemini";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../errors/AppError";

const logAiUsage = async (
  feature: string,
  input: string,
  output: string,
  userId?: string,
) => {
  await prisma.aiLog.create({
    data: { feature, input, output, userId },
  });
};

// ============================================================
// PRODUCT DESCRIPTION GENERATOR
// ============================================================

export const generateProductDescriptionService = async (
  userId: string,
  data: {
    productName: string;
    category: string;
    keyFeatures: string[];
    targetAudience?: string;
    tone?: "professional" | "casual" | "enthusiastic";
  },
) => {
  const prompt = `
You are an expert e-commerce copywriter for a Bangladeshi marketplace called Marketify.

Generate a compelling product description for the following product:

Product Name: ${data.productName}
Category: ${data.category}
Key Features: ${data.keyFeatures.join(", ")}
Target Audience: ${data.targetAudience ?? "general consumers"}
Tone: ${data.tone ?? "professional"}

Requirements:
- Write a short description (2-3 sentences) and a detailed description (1 paragraph)
- Highlight key benefits, not just features
- Make it SEO friendly
- Include relevant keywords naturally
- Write in English

Respond ONLY in this JSON format:
{
  "shortDescription": "...",
  "fullDescription": "...",
  "suggestedTags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}
`;

  const result = await geminiModel.generateContent(prompt);
  const text = result.response.text();

  let parsed: {
    shortDescription: string;
    fullDescription: string;
    suggestedTags: string[];
  };

  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new AppError("Failed to parse AI response", 500);
  }

  await logAiUsage("description_gen", JSON.stringify(data), text, userId);

  return parsed;
};

// ============================================================
// SMART PRICING SUGGESTION
// ============================================================

export const generatePricingSuggestionService = async (
  userId: string,
  data: {
    productName: string;
    category: string;
    condition?: string;
    competitorPrices?: number[];
    costPrice?: number;
  },
) => {
  const prompt = `
You are a pricing expert for a Bangladeshi e-commerce marketplace called Marketify.

Suggest an optimal selling price for this product:

Product Name: ${data.productName}
Category: ${data.category}
Condition: ${data.condition ?? "new"}
Cost Price: ${data.costPrice ? `${data.costPrice} BDT` : "not provided"}
Competitor Prices: ${data.competitorPrices?.length ? data.competitorPrices.map((p) => `${p} BDT`).join(", ") : "not provided"}

Consider the Bangladeshi market, typical margins, and competitiveness.

Respond ONLY in this JSON format:
{
  "suggestedPrice": 0,
  "minPrice": 0,
  "maxPrice": 0,
  "reasoning": "brief explanation",
  "profitMargin": "estimated margin percentage"
}
`;

  const result = await geminiModel.generateContent(prompt);
  const text = result.response.text();

  let parsed: {
    suggestedPrice: number;
    minPrice: number;
    maxPrice: number;
    reasoning: string;
    profitMargin: string;
  };

  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new AppError("Failed to parse AI response", 500);
  }

  await logAiUsage("pricing_suggestion", JSON.stringify(data), text, userId);

  return parsed;
};

// ============================================================
// REVIEW SENTIMENT ANALYSIS
// ============================================================

export const analyzeReviewSentimentService = async (
  reviewId: string,
  comment: string,
) => {
  const prompt = `
Analyze the sentiment of this product review:

Review: "${comment}"

Respond ONLY in this JSON format:
{
  "sentiment": "positive" | "negative" | "neutral",
  "score": 0.0 to 1.0,
  "isFake": true | false,
  "reason": "brief reason if fake, otherwise null"
}
`;

  const result = await geminiModel.generateContent(prompt);
  const text = result.response.text();

  let parsed: {
    sentiment: "positive" | "negative" | "neutral";
    score: number;
    isFake: boolean;
    reason: string | null;
  };

  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new AppError("Failed to parse AI response", 500);
  }

  // update review with sentiment
  await prisma.review.update({
    where: { id: reviewId },
    data: {
      sentiment: parsed.sentiment,
      aiFlag: parsed.isFake,
    },
  });

  await logAiUsage("sentiment_analysis", comment, text);

  return parsed;
};

// ============================================================
// SMART SEARCH
// ============================================================

export const aiSearchService = async (query: string) => {
  const prompt = `
You are a search engine assistant for a Bangladeshi e-commerce marketplace called Marketify.

User searched for: "${query}"

Extract search intent and generate optimized search keywords.

Respond ONLY in this JSON format:
{
  "cleanedQuery": "cleaned version of the query",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "category": "suggested category or null",
  "priceRange": { "min": null, "max": null },
  "intent": "browse" | "buy" | "compare"
}
`;

  const result = await geminiModel.generateContent(prompt);
  const text = result.response.text();

  let parsed: {
    cleanedQuery: string;
    keywords: string[];
    category: string | null;
    priceRange: { min: number | null; max: number | null };
    intent: string;
  };

  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new AppError("Failed to parse AI response", 500);
  }

  // search products using AI extracted keywords
  const products = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { name: { contains: parsed.cleanedQuery, mode: "insensitive" } },
        ...parsed.keywords.map((kw) => ({
          name: { contains: kw, mode: "insensitive" as const },
        })),
        ...parsed.keywords.map((kw) => ({
          tags: { has: kw },
        })),
        ...(parsed.category
          ? [
              {
                category: {
                  name: {
                    contains: parsed.category,
                    mode: "insensitive" as const,
                  },
                },
              },
            ]
          : []),
      ],
      ...(parsed.priceRange.min !== null || parsed.priceRange.max !== null
        ? {
            basePrice: {
              ...(parsed.priceRange.min !== null && {
                gte: parsed.priceRange.min,
              }),
              ...(parsed.priceRange.max !== null && {
                lte: parsed.priceRange.max,
              }),
            },
          }
        : {}),
    },
    take: 20,
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      category: { select: { name: true } },
      seller: { select: { shopName: true } },
    },
  });

  await logAiUsage("smart_search", query, text);

  return { parsed, products };
};

// ============================================================
// AI CHATBOT FOR USER SUPPORT
// ============================================================

export const aiChatbotService = async (
  userId: string,
  message: string,
  history: { role: "user" | "model"; text: string }[],
) => {
  const systemPrompt = `
You are a helpful customer support assistant for Marketify, a Bangladeshi e-commerce marketplace.

You can help users with:
- Order status and tracking
- Return and refund policies
- Product information
- General shopping guidance
- Payment issues

Rules:
- Be polite, helpful, and concise
- If you don't know something specific, guide them to contact support
- Keep responses short and clear
- You can respond in both English and Bangla based on user's language
`;

  const chat = geminiModel.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
      {
        role: "model",
        parts: [
          { text: "Understood. I am ready to help Marketify customers." },
        ],
      },
      ...history.map((h) => ({
        role: h.role,
        parts: [{ text: h.text }],
      })),
    ],
  });

  const result = await chat.sendMessage(message);
  const response = result.response.text();

  await logAiUsage("chatbot", message, response, userId);

  return { reply: response };
};

// ============================================================
// PRODUCT RECOMMENDATIONS
// ============================================================

export const getRecommendationsService = async (userId: string) => {
  // get user's purchase and browsing history
  const recentOrders = await prisma.order.findMany({
    where: { userId, status: "DELIVERED" },
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: {
            select: { name: true, categoryId: true, tags: true },
          },
        },
      },
    },
  });

  const purchasedCategories = [
    ...new Set(
      recentOrders.flatMap((o) => o.items.map((i) => i.product.categoryId)),
    ),
  ];

  const purchasedTags = [
    ...new Set(
      recentOrders.flatMap((o) => o.items.flatMap((i) => i.product.tags)),
    ),
  ];

  // get recommended products based on categories and tags
  const recommendations = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { categoryId: { in: purchasedCategories } },
        { tags: { hasSome: purchasedTags } },
      ],
      NOT: {
        orderItems: {
          some: { order: { userId } },
        },
      },
    },
    take: 12,
    orderBy: [{ avgRating: "desc" }, { totalSold: "desc" }],
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      category: { select: { name: true } },
      seller: { select: { shopName: true } },
    },
  });

  // if no history, return popular products
  if (recommendations.length === 0) {
    return prisma.product.findMany({
      where: { status: "ACTIVE" },
      take: 12,
      orderBy: [{ totalSold: "desc" }, { avgRating: "desc" }],
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        category: { select: { name: true } },
        seller: { select: { shopName: true } },
      },
    });
  }

  return recommendations;
};
