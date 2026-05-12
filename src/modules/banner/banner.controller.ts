import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendResponse } from "../../utils/sendResponse";
import {
  createBannerService,
  getActiveBannersService,
  getAllBannersService,
  updateBannerService,
  deleteBannerService,
  reorderBannersService,
} from "./banner.service";

export const createBanner = asyncHandler(
  async (req: Request, res: Response) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const imageUrl = files?.image?.[0]
      ? (files.image[0] as any).path
      : undefined;
    const mobileImageUrl = files?.mobileImage?.[0]
      ? (files.mobileImage[0] as any).path
      : undefined;

    if (!imageUrl) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Banner image is required.",
      });
    }

    const banner = await createBannerService(
      req.body,
      imageUrl,
      mobileImageUrl,
    );
    sendResponse({
      res,
      statusCode: 201,
      message: "Banner created successfully.",
      data: banner,
    });
  },
);

export const getActiveBanners = asyncHandler(
  async (req: Request, res: Response) => {
    const { position } = req.query;
    const banners = await getActiveBannersService(position as string);
    sendResponse({
      res,
      message: "Banners fetched successfully.",
      data: banners,
    });
  },
);

export const getAllBanners = asyncHandler(
  async (req: Request, res: Response) => {
    const banners = await getAllBannersService();
    sendResponse({
      res,
      message: "Banners fetched successfully.",
      data: banners,
    });
  },
);

export const updateBanner = asyncHandler(
  async (req: Request, res: Response) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const imageUrl = files?.image?.[0]
      ? (files.image[0] as any).path
      : undefined;
    const mobileImageUrl = files?.mobileImage?.[0]
      ? (files.mobileImage[0] as any).path
      : undefined;

    const banner = await updateBannerService(
      req.params.id as string,
      req.body,
      imageUrl,
      mobileImageUrl,
    );
    sendResponse({
      res,
      message: "Banner updated successfully.",
      data: banner,
    });
  },
);

export const deleteBanner = asyncHandler(
  async (req: Request, res: Response) => {
    await deleteBannerService(req.params.id as string);
    sendResponse({ res, message: "Banner deleted successfully." });
  },
);

export const reorderBanners = asyncHandler(
  async (req: Request, res: Response) => {
    await reorderBannersService(req.body.banners);
    sendResponse({ res, message: "Banners reordered successfully." });
  },
);
