import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendResponse } from "../../utils/sendResponse";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  generateProductDescriptionService,
  generatePricingSuggestionService,
  analyzeReviewSentimentService,
  aiSearchService,
  generateSmartReplyService,
  aiChatbotService,
  getRecommendationsService,
} from "./ai.service";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../errors/AppError";

export const generateDescription = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await generateProductDescriptionService(
      req.user!.id,
      req.body,
    );
    sendResponse({ res, message: "Description generated.", data: result });
  },
);

export const pricingSuggestion = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await generatePricingSuggestionService(
      req.user!.id,
      req.body,
    );
    sendResponse({
      res,
      message: "Pricing suggestion generated.",
      data: result,
    });
  },
);

export const analyzeReview = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const review = await prisma.review.findUnique({
      where: { id: req.params.reviewId as string },
    });
    if (!review) throw new AppError("Review not found", 404);
    if (!review.comment)
      throw new AppError("Review has no comment to analyze", 400);

    const result = await analyzeReviewSentimentService(
      review.id,
      review.comment,
    );
    sendResponse({ res, message: "Sentiment analyzed.", data: result });
  },
);

export const smartSearch = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query.q as string;
  const result = await aiSearchService(query);
  sendResponse({ res, message: "Search results.", data: result });
});

export const smartReply = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const seller = await prisma.seller.findUnique({
      where: { userId: req.user!.id },
    });
    if (!seller) throw new AppError("Seller not found", 404);

    const result = await generateSmartReplyService(
      seller.id,
      req.params.conversationId as string,
    );
    sendResponse({ res, message: "Smart replies generated.", data: result });
  },
);

export const chatbot = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { message, history } = req.body;
  const result = await aiChatbotService(req.user!.id, message, history);
  sendResponse({ res, message: "Chatbot response.", data: result });
});

export const getRecommendations = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const products = await getRecommendationsService(req.user!.id);
    sendResponse({ res, message: "Recommendations fetched.", data: products });
  },
);
