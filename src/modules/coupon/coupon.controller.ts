import { Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendResponse } from "../../utils/sendResponse";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  createCouponService,
  getMyCouponsService,
  updateCouponService,
  deleteCouponService,
} from "./coupon.service";

export const createCoupon = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const coupon = await createCouponService(
      req.user!.id,
      req.user!.role,
      req.body,
    );
    sendResponse({
      res,
      statusCode: 201,
      message: "Coupon created successfully.",
      data: coupon,
    });
  },
);

export const getMyCoupons = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const coupons = await getMyCouponsService(req.user!.id, req.user!.role);
    sendResponse({
      res,
      message: "Coupons fetched successfully.",
      data: coupons,
    });
  },
);

export const updateCoupon = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const coupon = await updateCouponService(
      req.user!.id,
      req.user!.role,
      req.params.id as string,
      req.body,
    );
    sendResponse({
      res,
      message: "Coupon updated successfully.",
      data: coupon,
    });
  },
);

export const deleteCoupon = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    await deleteCouponService(req.user!.id, req.user!.role, req.params.id as string);
    sendResponse({ res, message: "Coupon deleted successfully." });
  },
);
