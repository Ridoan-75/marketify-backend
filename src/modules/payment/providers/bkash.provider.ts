import axios from "axios";
import { env } from "../../../config/index";
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../errors/AppError";
import { redis } from "../../../config/redis";

const BKASH_TOKEN_KEY = "bkash:token";

const getBkashToken = async (): Promise<string> => {
  const cached = await redis.get(BKASH_TOKEN_KEY);
  if (cached) return cached;

  const response = await axios.post(
    `${env.BKASH_BASE_URL}/tokenized/checkout/token/grant`,
    {
      app_key: env.BKASH_APP_KEY,
      app_secret: env.BKASH_APP_SECRET,
    },
    {
      headers: {
        username: env.BKASH_USERNAME,
        password: env.BKASH_PASSWORD,
        "Content-Type": "application/json",
      },
    },
  );

  const token = response.data.id_token;
  const expiresIn = response.data.expires_in ?? 3600;

  await redis.set(BKASH_TOKEN_KEY, token, "EX", expiresIn - 60);
  return token;
};

export const createBkashPayment = async (orderId: string, userId: string) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { payment: true },
  });

  if (!order) throw new AppError("Order not found", 404);
  if (order.payment?.status === "PAID")
    throw new AppError("Order already paid", 400);

  const token = await getBkashToken();

  const response = await axios.post(
    `${env.BKASH_BASE_URL}/tokenized/checkout/create`,
    {
      mode: "0011",
      payerReference: userId,
      callbackURL: `${env.CLIENT_URL}/payment/bkash/callback?orderId=${orderId}`,
      amount: order.total.toString(),
      currency: "BDT",
      intent: "sale",
      merchantInvoiceNumber: `MKT-${orderId}`,
    },
    {
      headers: {
        Authorization: token,
        "X-App-Key": env.BKASH_APP_KEY,
        "Content-Type": "application/json",
      },
    },
  );

  if (response.data.statusCode !== "0000") {
    throw new AppError(
      response.data.statusMessage ?? "bKash payment init failed",
      500,
    );
  }

  await prisma.payment.update({
    where: { orderId },
    data: {
      transactionId: response.data.paymentID,
      gatewayResponse: response.data as object,
    },
  });

  return {
    bkashURL: response.data.bkashURL,
    paymentID: response.data.paymentID,
  };
};

export const executeBkashPayment = async (
  paymentID: string,
  orderId: string,
) => {
  const token = await getBkashToken();

  const response = await axios.post(
    `${env.BKASH_BASE_URL}/tokenized/checkout/execute`,
    { paymentID },
    {
      headers: {
        Authorization: token,
        "X-App-Key": env.BKASH_APP_KEY,
        "Content-Type": "application/json",
      },
    },
  );

  const payment = await prisma.payment.findUnique({ where: { orderId } });
  if (!payment) throw new AppError("Payment not found", 404);

  if (response.data.statusCode === "0000") {
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { orderId },
        data: {
          status: "PAID",
          paidAt: new Date(),
          gatewayResponse: response.data as object,
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: { status: "CONFIRMED" },
      });

      const orderItems = await tx.orderItem.findMany({ where: { orderId } });

      for (const item of orderItems) {
        await tx.seller.update({
          where: { id: item.sellerId },
          data: {
            totalEarnings: { increment: item.totalPrice * 0.9 },
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

    return { success: true, transactionId: response.data.trxID };
  } else {
    await prisma.payment.update({
      where: { orderId },
      data: { status: "FAILED", gatewayResponse: response.data as object },
    });

    throw new AppError(
      response.data.statusMessage ?? "bKash payment failed",
      400,
    );
  }
};
