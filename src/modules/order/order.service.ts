import { prisma } from "../../lib/prisma";
import { AppError } from "../../errors/AppError";
import { paginate, paginateMeta } from "../../utils/paginate";
import {
  PlaceOrderInput,
  UpdateOrderStatusInput,
  OrderQueryInput,
} from "./order.validation";

export const placeOrderService = async (
  userId: string,
  data: PlaceOrderInput,
) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
    },
  });

  if (!cart || cart.items.length === 0)
    throw new AppError("Cart is empty", 400);

  const address = await prisma.address.findFirst({
    where: { id: data.addressId, userId },
  });
  if (!address) throw new AppError("Address not found", 404);

  // calculate subtotal
  let subtotal = 0;
  for (const item of cart.items) {
    const price = item.variant
      ? (item.variant.discountPrice ?? item.variant.price)
      : (item.product.discountPrice ?? item.product.basePrice);
    subtotal += price * item.quantity;

    // check stock
    const stock = item.variant ? item.variant.stock : item.product.stock;
    if (item.quantity > stock)
      throw new AppError(`Insufficient stock for ${item.product.name}`, 400);
  }

  // apply coupon
  let discountAmount = 0;
  let couponId: string | null = null;

  if (data.couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: data.couponCode },
    });

    if (coupon && coupon.isActive) {
      const now = new Date();
      const isValid =
        (!coupon.startsAt || coupon.startsAt <= now) &&
        (!coupon.expiresAt || coupon.expiresAt >= now) &&
        (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) &&
        (!coupon.minOrderAmount || subtotal >= coupon.minOrderAmount);

      if (isValid) {
        discountAmount =
          coupon.type === "PERCENTAGE"
            ? (subtotal * coupon.value) / 100
            : coupon.value;

        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
          discountAmount = coupon.maxDiscount;
        }
        couponId = coupon.id;
      }
    }
  }

  const shippingCost = cart.items.some((i) => i.product.isFreeShipping)
    ? 0
    : 60;
  const total = subtotal - discountAmount + shippingCost;

  // create order in transaction
  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        userId,
        addressId: data.addressId,
        subtotal,
        discountAmount,
        shippingCost,
        total,
        note: data.note,
        items: {
          create: cart.items.map((item) => {
            const unitPrice = item.variant
              ? (item.variant.discountPrice ?? item.variant.price)
              : (item.product.discountPrice ?? item.product.basePrice);

            return {
              productId: item.productId,
              variantId: item.variantId,
              sellerId: item.product.sellerId,
              quantity: item.quantity,
              unitPrice,
              totalPrice: unitPrice * item.quantity,
            };
          }),
        },
        payment: {
          create: {
            method: data.paymentMethod,
            amount: total,
            status: data.paymentMethod === "COD" ? "PENDING" : "PENDING",
          },
        },
      },
      include: {
        items: true,
        payment: true,
      },
    });

    // coupon usage increment
    if (couponId) {
      await tx.orderCoupon.create({
        data: { orderId: newOrder.id, couponId, discountAmount },
      });
      await tx.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } },
      });
    }

    // deduct stock
    for (const item of cart.items) {
      if (item.variantId) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      } else {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }

    // clear cart
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return newOrder;
  });

  return order;
};

export const getMyOrdersService = async (
  userId: string,
  query: OrderQueryInput,
) => {
  const { skip, take, page, limit } = paginate({
    page: query.page,
    limit: query.limit,
  });

  const where = {
    userId,
    ...(query.status && { status: query.status }),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
            variant: { select: { price: true, image: true } },
          },
        },
        payment: { select: { method: true, status: true, amount: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, meta: paginateMeta(total, page, limit) };
};

export const getOrderByIdService = async (userId: string, orderId: string) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
          variant: true,
          seller: { select: { shopName: true, shopSlug: true } },
          delivery: true,
        },
      },
      address: true,
      payment: true,
      coupons: { include: { coupon: true } },
    },
  });

  if (!order) throw new AppError("Order not found", 404);
  return order;
};

export const getSellerOrdersService = async (
  userId: string,
  query: OrderQueryInput,
) => {
  const seller = await prisma.seller.findUnique({ where: { userId } });
  if (!seller) throw new AppError("Seller not found", 404);

  const { skip, take, page, limit } = paginate({
    page: query.page,
    limit: query.limit,
  });

  const where = {
    sellerId: seller.id,
    ...(query.status && { status: query.status }),
  };

  const [items, total] = await Promise.all([
    prisma.orderItem.findMany({
      where,
      skip,
      take,
      orderBy: { order: { createdAt: "desc" } },
      include: {
        order: {
          select: {
            id: true,
            createdAt: true,
            total: true,
            user: { select: { name: true, email: true } },
            address: true,
          },
        },
        product: {
          select: {
            name: true,
            images: { where: { isPrimary: true }, take: 1 },
          },
        },
        variant: { select: { price: true, image: true } },
        delivery: true,
      },
    }),
    prisma.orderItem.count({ where }),
  ]);

  return { orders: items, meta: paginateMeta(total, page, limit) };
};

export const updateOrderItemStatusService = async (
  userId: string,
  orderItemId: string,
  data: UpdateOrderStatusInput,
) => {
  const seller = await prisma.seller.findUnique({ where: { userId } });
  if (!seller) throw new AppError("Seller not found", 404);

  const item = await prisma.orderItem.findFirst({
    where: { id: orderItemId, sellerId: seller.id },
  });
  if (!item) throw new AppError("Order item not found", 404);

  return prisma.orderItem.update({
    where: { id: orderItemId },
    data: { status: data.status },
  });
};

export const cancelOrderService = async (userId: string, orderId: string) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { items: true },
  });
  if (!order) throw new AppError("Order not found", 404);

  const cancellable = ["PENDING", "CONFIRMED"];
  if (!cancellable.includes(order.status))
    throw new AppError("Order cannot be cancelled at this stage", 400);

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });

    // restore stock
    for (const item of order.items) {
      if (item.variantId) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      } else {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }
  });

  return true;
};
