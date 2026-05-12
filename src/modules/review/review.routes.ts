import { Router } from "express";
import {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
  toggleReviewVisibility,
} from "./review.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { uploadProduct } from "../../middlewares/upload.middleware";
import { createReviewSchema, updateReviewSchema } from "./review.validation";

const reviewRouter = Router();

reviewRouter.get("/product/:productId", getProductReviews);

reviewRouter.post(
  "/",
  authenticate,
  authorize("USER"),
  uploadProduct.array("images", 5),
  validate(createReviewSchema),
  createReview,
);

reviewRouter.patch(
  "/:id",
  authenticate,
  authorize("USER"),
  validate(updateReviewSchema),
  updateReview,
);

reviewRouter.delete("/:id", authenticate, authorize("USER"), deleteReview);

reviewRouter.patch(
  "/:id/visibility",
  authenticate,
  authorize("ADMIN"),
  toggleReviewVisibility,
);

export { reviewRouter };
