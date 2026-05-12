import { Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendResponse } from "../../utils/sendResponse";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  initiateDeliveryService,
  trackDeliveryService,
  updateDeliveryStatusService,
  getDeliveryByOrderItemService,
} from "./delivery.service";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../errors/AppError";

export const initiateDelivery = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const seller = await prisma.seller.findUnique({
      where: { userId: req.user!.id },
    });
    if (!seller) throw new AppError("Seller not found", 404);

    const { orderItemId } = req.body;

    const delivery = await initiateDeliveryService(orderItemId, seller.id);
    sendResponse({
      res,
      statusCode: 201,
      message: "Delivery initiated.",
      data: delivery,
    });
  },
);
export const trackDelivery = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await trackDeliveryService(
      req.params.orderItemId as string,
      req.user!.id,
    );
    sendResponse({ res, message: "Tracking info fetched.", data: result });
  },
);

export const updateDeliveryStatus = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const seller = await prisma.seller.findUnique({
      where: { userId: req.user!.id },
    });
    if (!seller) throw new AppError("Seller not found", 404);

    const delivery = await updateDeliveryStatusService(
      req.params.orderItemId as string,
      req.body.status,
      seller.id,
    );
    sendResponse({ res, message: "Delivery status updated.", data: delivery });
  },
);

export const getDeliveryByOrderItem = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const delivery = await getDeliveryByOrderItemService(
      req.params.orderItemId as string,
      req.user!.id,
    );
    sendResponse({ res, message: "Delivery fetched.", data: delivery });
  },
);
