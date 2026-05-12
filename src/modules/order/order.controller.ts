import { Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendResponse } from "../../utils/sendResponse";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  placeOrderService,
  getMyOrdersService,
  getOrderByIdService,
  getSellerOrdersService,
  updateOrderItemStatusService,
  cancelOrderService,
} from "./order.service";

export const placeOrder = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const order = await placeOrderService(req.user!.id, req.body);
    sendResponse({
      res,
      statusCode: 201,
      message: "Order placed successfully.",
      data: order,
    });
  },
);

export const getMyOrders = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await getMyOrdersService(req.user!.id, req.query as any);
    sendResponse({
      res,
      message: "Orders fetched successfully.",
      data: result.orders,
      meta: result.meta,
    });
  },
);

export const getOrderById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const order = await getOrderByIdService(req.user!.id, req.params.id as string);
    sendResponse({ res, message: "Order fetched successfully.", data: order });
  },
);

export const getSellerOrders = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await getSellerOrdersService(req.user!.id, req.query as any);
    sendResponse({
      res,
      message: "Orders fetched successfully.",
      data: result.orders,
      meta: result.meta,
    });
  },
);

export const updateOrderItemStatus = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const item = await updateOrderItemStatusService(
      req.user!.id,
      req.params.itemId as string,
      req.body,
    );
    sendResponse({ res, message: "Order status updated.", data: item });
  },
);

export const cancelOrder = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    await cancelOrderService(req.user!.id, req.params.id as string);
    sendResponse({ res, message: "Order cancelled successfully." });
  },
);
