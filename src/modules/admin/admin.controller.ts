import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendResponse } from "../../utils/sendResponse";
import {
  getAdminDashboardService,
  getAllUsersService,
  banUserService,
  unbanUserService,
  getPendingSellersService,
  getAllSellersService,
  approveSellerService,
  rejectSellerService,
  suspendSellerService,
  getAllOrdersService,
  getAllProductsAdminService,
  updateProductStatusAdminService,
  confirmCODPaymentService,
} from "./admin.service";

export const getAdminDashboard = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await getAdminDashboardService();
    sendResponse({ res, message: "Dashboard fetched successfully.", data });
  },
);

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const search = req.query.search as string | undefined;
  const result = await getAllUsersService(page, limit, search);
  sendResponse({
    res,
    message: "Users fetched successfully.",
    data: result.users,
    meta: result.meta,
  });
});

export const banUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await banUserService(req.params.userId as string, req.body.reason);
  sendResponse({ res, message: "User banned successfully.", data: user });
});

export const unbanUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await unbanUserService(req.params.userId as string);
  sendResponse({ res, message: "User unbanned successfully.", data: user });
});

export const getPendingSellers = asyncHandler(
  async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await getPendingSellersService(page, limit);
    sendResponse({
      res,
      message: "Pending sellers fetched.",
      data: result.sellers,
      meta: result.meta,
    });
  },
);

export const getAllSellers = asyncHandler(
  async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = req.query.search as string | undefined;
    const result = await getAllSellersService(page, limit, search);
    sendResponse({
      res,
      message: "Sellers fetched successfully.",
      data: result.sellers,
      meta: result.meta,
    });
  },
);

export const approveSeller = asyncHandler(
  async (req: Request, res: Response) => {
    const seller = await approveSellerService(req.params.sellerId as string);
    sendResponse({
      res,
      message: "Seller approved successfully.",
      data: seller,
    });
  },
);

export const rejectSeller = asyncHandler(
  async (req: Request, res: Response) => {
    const seller = await rejectSellerService(
      req.params.sellerId as string,
      req.body.reason,
    );
    sendResponse({ res, message: "Seller rejected.", data: seller });
  },
);

export const suspendSeller = asyncHandler(
  async (req: Request, res: Response) => {
    const seller = await suspendSellerService(
      req.params.sellerId as string,
      req.body.reason,
    );
    sendResponse({ res, message: "Seller suspended.", data: seller });
  },
);

export const getAllOrders = asyncHandler(
  async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const status = req.query.status as string | undefined;
    const result = await getAllOrdersService(page, limit, status);
    sendResponse({
      res,
      message: "Orders fetched successfully.",
      data: result.orders,
      meta: result.meta,
    });
  },
);

export const getAllProductsAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const status = req.query.status as string | undefined;
    const result = await getAllProductsAdminService(page, limit, status);
    sendResponse({
      res,
      message: "Products fetched successfully.",
      data: result.products,
      meta: result.meta,
    });
  },
);

export const updateProductStatusAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const product = await updateProductStatusAdminService(
      req.params.productId as string,
      req.body.status,
    );
    sendResponse({ res, message: "Product status updated.", data: product });
  },
);

export const confirmCODPayment = asyncHandler(
  async (req: Request, res: Response) => {
    await confirmCODPaymentService(req.params.orderId as string);
    sendResponse({ res, message: "COD payment confirmed successfully." });
  },
);
