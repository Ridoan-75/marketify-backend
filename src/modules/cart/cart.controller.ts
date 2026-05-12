import { Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendResponse } from "../../utils/sendResponse";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  getCartService,
  addToCartService,
  updateCartItemService,
  removeFromCartService,
  clearCartService,
  validateCouponService,
} from "./cart.service";

export const getCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const cart = await getCartService(req.user!.id);
  sendResponse({ res, message: "Cart fetched successfully.", data: cart });
});

export const addToCart = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const cart = await addToCartService(req.user!.id, req.body);
    sendResponse({
      res,
      statusCode: 201,
      message: "Item added to cart.",
      data: cart,
    });
  },
);

export const updateCartItem = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const cart = await updateCartItemService(
      req.user!.id,
      req.params.itemId as string,
      req.body,
    );
    sendResponse({ res, message: "Cart updated.", data: cart });
  },
);

export const removeFromCart = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const cart = await removeFromCartService(req.user!.id, req.params.itemId as string);
    sendResponse({ res, message: "Item removed from cart.", data: cart });
  },
);

export const clearCart = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    await clearCartService(req.user!.id);
    sendResponse({ res, message: "Cart cleared." });
  },
);

export const validateCoupon = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { code, subtotal } = req.body;
    const result = await validateCouponService(req.user!.id, code, subtotal);
    sendResponse({
      res,
      message: "Coupon applied successfully.",
      data: result,
    });
  },
);
