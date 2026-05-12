import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendResponse } from "../../utils/sendResponse";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  initiatePaymentService,
  executeBkashPaymentService,
  getPaymentStatusService,
  requestRefundService,
} from "./payment.service";
import { handleStripeWebhook } from "./providers/stripe.provider";
import { handleSSLCommerzIPN } from "./providers/sslcommerz.provider";

export const initiatePayment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { orderId, method } = req.body;
    const result = await initiatePaymentService(orderId, req.user!.id, method);
    sendResponse({ res, message: "Payment initiated.", data: result });
  },
);

export const bkashCallback = asyncHandler(
  async (req: Request, res: Response) => {
    const { paymentID, status } = req.query;
    const { orderId } = req.query;

    if (status === "cancel" || status === "failure") {
      return res.redirect(
        `${process.env.CLIENT_URL}/payment/failed?orderId=${orderId}`,
      );
    }

    const result = await executeBkashPaymentService(
      paymentID as string,
      orderId as string,
    );

    res.redirect(
      `${process.env.CLIENT_URL}/payment/success?orderId=${orderId}`,
    );
  },
);

export const stripeWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"] as string;
    await handleStripeWebhook(signature, req.body as Buffer);
    res.status(200).json({ received: true });
  },
);

export const sslcommerzIPN = asyncHandler(
  async (req: Request, res: Response) => {
    await handleSSLCommerzIPN(req.body);
    res.status(200).send("IPN received");
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
    const result = await requestRefundService(req.params.orderId as string, req.user!.id);
    sendResponse({ res, message: "Refund processed.", data: result });
  },
);
