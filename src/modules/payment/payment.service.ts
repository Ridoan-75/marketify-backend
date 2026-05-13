import { prisma } from "../../lib/prisma";
import { AppError } from "../../errors/AppError";
import {
  createStripePaymentIntent,
  createStripeRefund,
} from "./providers/stripe.provider";

export const initiatePaymentService = async (
  orderId: string,
  userId: string,
  method: string,
) => {
  switch (method) {
    case "STRIPE":
      return createStripePaymentIntent(orderId, userId);
    case "COD":
      return handleCODPayment(orderId, userId);
    default:
      throw new AppError("Unsupported payment method. Use STRIPE or COD.", 400);
  }
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

  // COD — manual refund
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

  return { message: "Refund processed successfully." };
};

const handleCODPayment = async (orderId: string, userId: string) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { payment: true },
  });

  if (!order) throw new AppError("Order not found", 404);
  if (order.payment?.status === "PAID")
    throw new AppError("Order already paid", 400);

  await prisma.payment.update({
    where: { orderId },
    data: {
      method: "COD",
      status: "PENDING",
    },
  });

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "CONFIRMED" },
  });

  return { message: "Cash on delivery order confirmed.", method: "COD" };
};
