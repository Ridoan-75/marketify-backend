import { Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendResponse } from "../../utils/sendResponse";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  getWishlistService,
  toggleWishlistService,
  checkWishlistService,
} from "./wishlist.service";

export const getWishlist = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    const result = await getWishlistService(req.user!.id, page, limit);
    sendResponse({
      res,
      message: "Wishlist fetched successfully.",
      data: result.items,
      meta: result.meta,
    });
  },
);

export const toggleWishlist = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await toggleWishlistService(
      req.user!.id,
      req.params.productId as string,
    );
    sendResponse({
      res,
      message: `Product ${result.action} wishlist.`,
      data: result,
    });
  },
);

export const checkWishlist = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await checkWishlistService(
      req.user!.id,
      req.params.productId as string,
    );
    sendResponse({ res, message: "Wishlist status fetched.", data: result });
  },
);
