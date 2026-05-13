import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendResponse } from "../../utils/sendResponse";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  initiatePaymentService,
  getPaymentStatusService,
  requestRefundService,
} from "./payment.service";
import { handleStripeWebhook } from "./providers/stripe.provider";

export const initiatePayment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { orderId, method } = req.body;
    const result = await initiatePaymentService(orderId, req.user!.id, method);
    sendResponse({ res, message: "Payment initiated.", data: result });
  },
);

export const stripeWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"] as string;
    await handleStripeWebhook(signature, req.body as Buffer);
    res.status(200).json({ received: true });
  },
);

export const getPaymentStatus = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const payment = await getPaymentStatusService(
      req.params.orderId as string,
      req.user!.id,
    );
    sendResponse({ res, message: "Payment status fetched.", data: payment });
  },
);

export const requestRefund = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await requestRefundService(
      req.params.orderId as string,
      req.user!.id,
    );
    sendResponse({ res, message: "Refund processed.", data: result });
  },
);
