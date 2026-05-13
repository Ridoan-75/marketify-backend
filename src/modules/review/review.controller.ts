import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendResponse } from '../../utils/sendResponse';
import { AuthRequest } from '../../middlewares/auth.middleware';
import {
  createReviewService,
  getProductReviewsService,
  updateReviewService,
  deleteReviewService,
  toggleReviewVisibilityService,
  getMyReviewsService,
  getAllReviewsService,
} from './review.service';

export const createReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const files = req.files as Express.Multer.File[];
  const imageUrls = files
    ? files.map((f) => (f as Express.Multer.File & { path: string }).path)
    : [];

  const review = await createReviewService(req.user!.id, req.body, imageUrls);
  sendResponse({ res, statusCode: 201, message: 'Review submitted successfully.', data: review });
});

export const getProductReviews = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const result = await getProductReviewsService(productId as string, page, limit);
  sendResponse({
    res,
    message: 'Reviews fetched successfully.',
    data: result.reviews,
    meta: { ...result.meta, ratingBreakdown: result.ratingBreakdown } as any,
  });
});

export const updateReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const review = await updateReviewService(req.user!.id, req.params.id as string, req.body);
  sendResponse({ res, message: 'Review updated successfully.', data: review });
});

export const deleteReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  await deleteReviewService(req.user!.id, req.params.id as string);
  sendResponse({ res, message: 'Review deleted successfully.' });
});

export const toggleReviewVisibility = asyncHandler(async (req: AuthRequest, res: Response) => {
  const review = await toggleReviewVisibilityService(req.params.id as string);
  sendResponse({ res, message: 'Review visibility updated.', data: review });
});

export const getMyReviews = asyncHandler(async (req: AuthRequest, res: Response) => {
  const reviews = await getMyReviewsService(req.user!.id);
  sendResponse({ res, message: 'Reviews fetched successfully.', data: reviews });
});

export const getAllReviews = asyncHandler(async (req: Request, res: Response) => {
  const reviews = await getAllReviewsService();
  sendResponse({ res, message: 'Reviews fetched.', data: reviews });
});