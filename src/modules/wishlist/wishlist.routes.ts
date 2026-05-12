import { Router } from "express";
import {
  getWishlist,
  toggleWishlist,
  checkWishlist,
} from "./wishlist.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const wishlistRouter = Router();

wishlistRouter.use(authenticate);

wishlistRouter.get("/", getWishlist);
wishlistRouter.post("/:productId/toggle", toggleWishlist);
wishlistRouter.get("/:productId/check", checkWishlist);

export { wishlistRouter };
