import { Router } from "express";
import {
  createCategory,
  getAllCategories,
  getAllCategoriesFlat,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
} from "./category.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { uploadAvatar } from "../../middlewares/upload.middleware";
import {
  createCategorySchema,
  updateCategorySchema,
} from "./category.validation";

const categoryRouter = Router();

// public
categoryRouter.get("/", getAllCategories);
categoryRouter.get("/flat", getAllCategoriesFlat);
categoryRouter.get("/:slug", getCategoryBySlug);

// admin only
categoryRouter.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  uploadAvatar.single("image"),
  validate(createCategorySchema),
  createCategory,
);

categoryRouter.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  uploadAvatar.single("image"),
  validate(updateCategorySchema),
  updateCategory,
);

categoryRouter.delete("/:id", authenticate, authorize("ADMIN"), deleteCategory);

export { categoryRouter };
