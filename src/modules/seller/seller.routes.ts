import { Router } from "express";
import {
  registerSeller,
  getMyShop,
  getShopBySlug,
  updateShop,
  uploadShopLogo,
  uploadShopBanner,
  getSellerDashboard,
} from "./seller.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  uploadAvatar,
  uploadBanner,
} from "../../middlewares/upload.middleware";
import { sellerRegisterSchema, updateShopSchema } from "./seller.validation";

const sellerRouter = Router();

// public
sellerRouter.get("/shop/:slug", getShopBySlug);

// authenticated
sellerRouter.use(authenticate);

sellerRouter.post("/register", validate(sellerRegisterSchema), registerSeller);
sellerRouter.get("/me/shop", getMyShop);
sellerRouter.get("/me/dashboard", getSellerDashboard);
sellerRouter.patch(
  "/me/shop",
  authorize("SELLER"),
  validate(updateShopSchema),
  updateShop,
);
sellerRouter.patch(
  "/me/shop/logo",
  authorize("SELLER"),
  uploadAvatar.single("logo"),
  uploadShopLogo,
);
sellerRouter.patch(
  "/me/shop/banner",
  authorize("SELLER"),
  uploadBanner.single("banner"),
  uploadShopBanner,
);

export { sellerRouter };
