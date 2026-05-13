import { Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendResponse } from "../../utils/sendResponse";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  registerSellerService,
  getMyShopService,
  getShopBySlugService,
  updateShopService,
  updateShopLogoService,
  updateShopBannerService,
  getSellerDashboardService,
  getFeaturedSellersService,
  getSellerWithdrawalsService,
  requestWithdrawalService,
} from "./seller.service";

export const registerSeller = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const seller = await registerSellerService(req.user!.id, req.body);
    sendResponse({
      res,
      statusCode: 201,
      message: "Shop registered successfully. Waiting for admin approval.",
      data: seller,
    });
  },
);

export const getMyShop = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const shop = await getMyShopService(req.user!.id);
    sendResponse({ res, message: "Shop fetched successfully.", data: shop });
  },
);

export const getShopBySlug = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const shop = await getShopBySlugService(req.params.slug as string);
    sendResponse({ res, message: "Shop fetched successfully.", data: shop });
  },
);

export const updateShop = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const shop = await updateShopService(req.user!.id, req.body);
    sendResponse({ res, message: "Shop updated successfully.", data: shop });
  },
);

export const uploadShopLogo = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "No file uploaded.",
      });
    }
    const logoUrl = (req.file as Express.Multer.File & { path: string }).path;
    const shop = await updateShopLogoService(req.user!.id, logoUrl);
    sendResponse({
      res,
      message: "Shop logo updated successfully.",
      data: shop,
    });
  },
);

export const uploadShopBanner = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "No file uploaded.",
      });
    }
    const bannerUrl = (req.file as Express.Multer.File & { path: string }).path;
    const shop = await updateShopBannerService(req.user!.id, bannerUrl);
    sendResponse({
      res,
      message: "Shop banner updated successfully.",
      data: shop,
    });
  },
);

export const getSellerDashboard = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const dashboard = await getSellerDashboardService(req.user!.id);
    sendResponse({
      res,
      message: "Dashboard fetched successfully.",
      data: dashboard,
    });
  },
);

export const getFeaturedSellers = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const sellers = await getFeaturedSellersService();
    sendResponse({ res, message: "Featured sellers fetched.", data: sellers });
  },
);

export const getSellerWithdrawals = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const withdrawals = await getSellerWithdrawalsService(req.user!.id);
    sendResponse({ res, message: "Withdrawals fetched.", data: withdrawals });
  },
);

export const requestWithdrawal = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const withdrawal = await requestWithdrawalService(req.user!.id, req.body);
    sendResponse({
      res,
      statusCode: 201,
      message: "Withdrawal request submitted.",
      data: withdrawal,
    });
  },
);
