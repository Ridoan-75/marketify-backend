import { Router } from "express";
import {
  createBanner,
  getActiveBanners,
  getAllBanners,
  updateBanner,
  deleteBanner,
  reorderBanners,
} from "./banner.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { uploadBanner } from "../../middlewares/upload.middleware";
import { createBannerSchema, updateBannerSchema } from "./banner.validation";

const bannerRouter = Router();

// public
bannerRouter.get("/", getActiveBanners);

// admin only
bannerRouter.get("/all", authenticate, authorize("ADMIN"), getAllBanners);

bannerRouter.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  uploadBanner.fields([
    { name: "image", maxCount: 1 },
    { name: "mobileImage", maxCount: 1 },
  ]),
  validate(createBannerSchema),
  createBanner,
);

bannerRouter.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  uploadBanner.fields([
    { name: "image", maxCount: 1 },
    { name: "mobileImage", maxCount: 1 },
  ]),
  validate(updateBannerSchema),
  updateBanner,
);

bannerRouter.delete("/:id", authenticate, authorize("ADMIN"), deleteBanner);
bannerRouter.patch(
  "/reorder",
  authenticate,
  authorize("ADMIN"),
  reorderBanners,
);

export { bannerRouter };
