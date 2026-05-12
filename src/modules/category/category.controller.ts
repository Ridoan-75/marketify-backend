import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendResponse } from "../../utils/sendResponse";
import {
  createCategoryService,
  getAllCategoriesService,
  getAllCategoriesFlatService,
  getCategoryBySlugService,
  updateCategoryService,
  deleteCategoryService,
} from "./category.service";

export const createCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const imageUrl = req.file
      ? (req.file as Express.Multer.File & { path: string }).path
      : undefined;

    const category = await createCategoryService(req.body, imageUrl);
    sendResponse({
      res,
      statusCode: 201,
      message: "Category created successfully.",
      data: category,
    });
  },
);

export const getAllCategories = asyncHandler(
  async (req: Request, res: Response) => {
    const categories = await getAllCategoriesService();
    sendResponse({
      res,
      message: "Categories fetched successfully.",
      data: categories,
    });
  },
);

export const getAllCategoriesFlat = asyncHandler(
  async (req: Request, res: Response) => {
    const categories = await getAllCategoriesFlatService();
    sendResponse({
      res,
      message: "Categories fetched successfully.",
      data: categories,
    });
  },
);

export const getCategoryBySlug = asyncHandler(
  async (req: Request, res: Response) => {
    const category = await getCategoryBySlugService(req.params.slug as string);
    sendResponse({
      res,
      message: "Category fetched successfully.",
      data: category,
    });
  },
);

export const updateCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const imageUrl = req.file
      ? (req.file as Express.Multer.File & { path: string }).path
      : undefined;

    const category = await updateCategoryService(
      req.params.id as string,
      req.body,
      imageUrl,
    );
    sendResponse({
      res,
      message: "Category updated successfully.",
      data: category,
    });
  },
);

export const deleteCategory = asyncHandler(
  async (req: Request, res: Response) => {
    await deleteCategoryService(req.params.id as string);
    sendResponse({ res, message: "Category deleted successfully." });
  },
);
