import Stripe from "stripe";
import { env } from "../../../config/index";
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../errors/AppError";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-04-22.dahlia",
});

export const createStripePaymentIntent = async (
  orderId: string,
  userId: string,
) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { payment: true },
  });

  if (!order) throw new AppError("Order not found", 404);
  if (order.payment?.status === "PAID")
    throw new AppError("Order already paid", 400);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(order.total * 100), // stripe uses smallest currency unit
    currency: "bdt",
    metadata: { orderId, userId },
  });

  await prisma.payment.update({
    where: { orderId },
    data: {
      transactionId: paymentIntent.id,
      gatewayResponse: paymentIntent as object,
    },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount: order.total,
  };
};

export const handleStripeWebhook = async (
  signature: string,
  rawBody: Buffer,
) => {
  let event: any;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    throw new AppError("Invalid stripe webhook signature", 400);
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as any;
    const orderId = intent.metadata.orderId;

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { orderId },
        data: {
          status: "PAID",
          paidAt: new Date(),
          gatewayResponse: intent as object,
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: { status: "CONFIRMED" },
      });

      // update seller earnings
      const orderItems = await tx.orderItem.findMany({
        where: { orderId },
      });

      for (const item of orderItems) {
        await tx.seller.update({
          where: { id: item.sellerId },
          data: {
            totalEarnings: { increment: item.totalPrice * 0.9 }, // 10% platform fee
            balance: { increment: item.totalPrice * 0.9 },
            totalSales: { increment: 1 },
          },
        });

        await tx.product.update({
          where: { id: item.productId },
          data: { totalSold: { increment: item.quantity } },
        });
      }
    });
  }

  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object as any;
    const orderId = intent.metadata.orderId;

    await prisma.payment.update({
      where: { orderId },
      data: {
        status: "FAILED",
        gatewayResponse: intent as object,
      },
    });
  }

  return true;
};

export const createStripeRefund = async (orderId: string) => {
  const payment = await prisma.payment.findUnique({ where: { orderId } });
  if (!payment) throw new AppError("Payment not found", 404);
  if (payment.status !== "PAID") throw new AppError("Payment not paid", 400);
  if (!payment.transactionId)
    throw new AppError("Transaction ID not found", 400);

  const refund = await stripe.refunds.create({
    payment_intent: payment.transactionId,
  });

  await prisma.payment.update({
    where: { orderId },
    data: {
      status: "REFUNDED",
      refundedAt: new Date(),
      refundAmount: payment.amount,
      gatewayResponse: refund as object,
    },
  });

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "REFUNDED" },
  });

  return refund;
};
