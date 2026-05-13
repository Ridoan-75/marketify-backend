import { Router } from "express";
import express from "express";
import {
  initiatePayment,
  stripeWebhook,
  getPaymentStatus,
  requestRefund,
} from "./payment.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const paymentRouter = Router();

// stripe webhook needs raw body
paymentRouter.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook,
);

// authenticated routes
paymentRouter.post("/initiate", authenticate, initiatePayment);
paymentRouter.get("/:orderId/status", authenticate, getPaymentStatus);
paymentRouter.post("/:orderId/refund", authenticate, requestRefund);

export { paymentRouter };
