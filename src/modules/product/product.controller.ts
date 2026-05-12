import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendResponse } from "../../utils/sendResponse";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  createProductService,
  getProductsService,
  getProductBySlugService,
  getSellerProductsService,
  updateProductService,
  deleteProductService,
  addProductImagesService,
  deleteProductImageService,
} from "./product.service";

export const createProduct = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const files = req.files as Express.Multer.File[];
    const imageUrls = files
      ? files.map((f) => (f as Express.Multer.File & { path: string }).path)
      : [];

    const product = await createProductService(
      req.user!.id,
      req.body,
      imageUrls,
    );
    sendResponse({
      res,
      statusCode: 201,
      message: "Product created successfully.",
      data: product,
    });
  },
);

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const result = await getProductsService(req.query as any);
  sendResponse({
    res,
    message: "Products fetched successfully.",
    data: result.products,
    meta: result.meta,
  });
});

export const getProductBySlug = asyncHandler(
  async (req: Request, res: Response) => {
    const product = await getProductBySlugService(req.params.slug as string);
    sendResponse({
      res,
      message: "Product fetched successfully.",
      data: product,
    });
  },
);

export const getSellerProducts = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await getSellerProductsService(
      req.user!.id,
      req.query as any,
    );
    sendResponse({
      res,
      message: "Products fetched successfully.",
      data: result.products,
      meta: result.meta,
    });
  },
);

export const updateProduct = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const product = await updateProductService(
      req.user!.id,
      req.params.id as string,
      req.body,
    );
    sendResponse({
      res,
      message: "Product updated successfully.",
      data: product,
    });
  },
);

export const deleteProduct = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    await deleteProductService(req.user!.id, req.params.id as string);
    sendResponse({ res, message: "Product deleted successfully." });
  },
);

export const addProductImages = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const files = req.files as Express.Multer.File[];
    const imageUrls = files
      ? files.map((f) => (f as Express.Multer.File & { path: string }).path)
      : [];

    const product = await addProductImagesService(
      req.user!.id,
      req.params.id as string,
      imageUrls,
    );
    sendResponse({ res, message: "Images added successfully.", data: product });
  },
);

export const deleteProductImage = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    await deleteProductImageService(req.user!.id, req.params.imageId as string);
    sendResponse({ res, message: "Image deleted successfully." });
  },
);
