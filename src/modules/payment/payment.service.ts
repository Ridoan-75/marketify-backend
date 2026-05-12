import { prisma } from "../../lib/prisma";
import { AppError } from "../../errors/AppError";
import {
  createStripePaymentIntent,
  createStripeRefund,
} from "./providers/stripe.provider";
import { initSSLCommerzPayment } from "./providers/sslcommerz.provider";
import {
  createBkashPayment,
  executeBkashPayment,
} from "./providers/bkash.provider";

export const initiatePaymentService = async (
  orderId: string,
  userId: string,
  method: string,
) => {
  switch (method) {
    case "STRIPE":
      return createStripePaymentIntent(orderId, userId);
    case "SSLCOMMERZ":
      return initSSLCommerzPayment(orderId, userId);
    case "BKASH":
      return createBkashPayment(orderId, userId);
    default:
      throw new AppError("Unsupported payment method", 400);
  }
};

export const executeBkashPaymentService = async (
  paymentID: string,
  orderId: string,
) => {
  return executeBkashPayment(paymentID, orderId);
};

export const getPaymentStatusService = async (
  orderId: string,
  userId: string,
) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: {
      payment: {
        select: {
          id: true,
          method: true,
          status: true,
          amount: true,
          currency: true,
          transactionId: true,
          paidAt: true,
          refundedAt: true,
          refundAmount: true,
        },
      },
    },
  });

  if (!order) throw new AppError("Order not found", 404);
  return order.payment;
};

export const requestRefundService = async (orderId: string, userId: string) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { payment: true },
  });

  if (!order) throw new AppError("Order not found", 404);
  if (!order.payment) throw new AppError("Payment not found", 404);
  if (order.payment.status !== "PAID")
    throw new AppError("Payment is not paid", 400);

  if (order.payment.method === "STRIPE") {
    return createStripeRefund(orderId);
  }

  // for other methods, mark as refund requested for manual processing
  await prisma.payment.update({
    where: { orderId },
    data: {
      status: "REFUNDED",
      refundedAt: new Date(),
      refundAmount: order.payment.amount,
    },
  });

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "REFUNDED" },
  });

  return { message: "Refund requested successfully." };
};
