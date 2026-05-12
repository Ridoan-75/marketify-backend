import SSLCommerzPayment from "sslcommerz-lts";
import { env } from "../../../config/index";
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../errors/AppError";

const isLive = env.SSLCOMMERZ_IS_LIVE === "true";

export const initSSLCommerzPayment = async (
  orderId: string,
  userId: string,
) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: {
      payment: true,
      user: { select: { name: true, email: true, phone: true } },
      address: true,
    },
  });

  if (!order) throw new AppError("Order not found", 404);
  if (order.payment?.status === "PAID")
    throw new AppError("Order already paid", 400);

  const transactionId = `MKT-${orderId}-${Date.now()}`;

  const data = {
    total_amount: order.total,
    currency: "BDT",
    tran_id: transactionId,
    success_url: `${env.CLIENT_URL}/payment/success?orderId=${orderId}`,
    fail_url: `${env.CLIENT_URL}/payment/failed?orderId=${orderId}`,
    cancel_url: `${env.CLIENT_URL}/payment/cancelled?orderId=${orderId}`,
    ipn_url: `${env.SERVER_URL}/api/v1/payment/sslcommerz/ipn`,
    shipping_method: "Courier",
    product_name: "Marketify Order",
    product_category: "E-commerce",
    product_profile: "general",
    cus_name: order.user.name,
    cus_email: order.user.email,
    cus_add1: order.address.addressLine1,
    cus_city: order.address.city,
    cus_country: order.address.country,
    cus_phone: order.user.phone ?? "01700000000",
    ship_name: order.address.fullName,
    ship_add1: order.address.addressLine1,
    ship_city: order.address.city,
    ship_country: order.address.country,
  };

  const sslcz = new SSLCommerzPayment(
    env.SSLCOMMERZ_STORE_ID,
    env.SSLCOMMERZ_STORE_PASSWORD,
    isLive,
  );

  const apiResponse = await sslcz.init(data);

  if (!apiResponse?.GatewayPageURL) {
    throw new AppError("Failed to initialize SSLCommerz payment", 500);
  }

  await prisma.payment.update({
    where: { orderId },
    data: {
      transactionId,
      gatewayResponse: apiResponse as object,
    },
  });

  return { gatewayUrl: apiResponse.GatewayPageURL, transactionId };
};

export const validateSSLCommerzPayment = async (
  transactionId: string,
  amount: number,
) => {
  const sslcz = new SSLCommerzPayment(
    env.SSLCOMMERZ_STORE_ID,
    env.SSLCOMMERZ_STORE_PASSWORD,
    isLive,
  );

  const response = await sslcz.validate({
    val_id: transactionId,
    amount,
    currency: "BDT",
  });
  return response;
};

export const handleSSLCommerzIPN = async (body: Record<string, string>) => {
  const { tran_id, status, amount } = body;

  const payment = await prisma.payment.findFirst({
    where: { transactionId: tran_id },
    include: { order: { include: { items: true } } },
  });

  if (!payment) return false;

  if (status === "VALID" || status === "VALIDATED") {
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "PAID",
          paidAt: new Date(),
          gatewayResponse: body as object,
        },
      });

      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: "CONFIRMED" },
      });

      for (const item of payment.order.items) {
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
  } else {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", gatewayResponse: body as object },
    });
  }

  return true;
};
