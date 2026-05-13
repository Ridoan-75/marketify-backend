import { Router } from 'express';
import {
  createReview,
  getProductReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  toggleReviewVisibility,
} from './review.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { uploadProduct } from '../../middlewares/upload.middleware';
import { createReviewSchema, updateReviewSchema } from './review.validation';
import { getAllReviewsService } from './review.service';

const reviewRouter = Router();

reviewRouter.get('/product/:productId', getProductReviews);

reviewRouter.get('/my-reviews', authenticate, getMyReviews);

reviewRouter.post(
  '/',
  authenticate,
  authorize('USER'),
  uploadProduct.array('images', 5),
  validate(createReviewSchema),
  createReview
);

reviewRouter.patch(
  '/:id',
  authenticate,
  authorize('USER'),
  validate(updateReviewSchema),
  updateReview
);

reviewRouter.delete('/:id', authenticate, authorize('USER'), deleteReview);

reviewRouter.patch(
  '/:id/visibility',
  authenticate,
  authorize('ADMIN'),
  toggleReviewVisibility
);

// admin only
reviewRouter.get(
  '/all',
  authenticate,
  authorize('ADMIN'),
  getAllReviewsService
);

export { reviewRouter };