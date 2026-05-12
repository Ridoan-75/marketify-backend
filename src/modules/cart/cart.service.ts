import { prisma } from "../../lib/prisma";
import { AppError } from "../../errors/AppError";
import { AddToCartInput, UpdateCartItemInput } from "./cart.validation";

const getOrCreateCart = async (userId: string) => {
  let cart = await prisma.cart.findUnique({
    where: { userId },
  });

  if (!cart) {
    cart = await prisma.cart.create({ data: { userId } });
  }

  return cart;
};

const buildCartResponse = async (userId: string) => {
  return prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              basePrice: true,
              discountPrice: true,
              stock: true,
              isFreeShipping: true,
              seller: {
                select: { id: true, shopName: true, shopSlug: true },
              },
              images: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
          variant: {
            select: {
              id: true,
              price: true,
              discountPrice: true,
              stock: true,
              image: true,
              attributes: {
                include: { attributeValue: true },
              },
            },
          },
        },
      },
    },
  });
};

export const getCartService = async (userId: string) => {
  await getOrCreateCart(userId);
  const cart = await buildCartResponse(userId);

  if (!cart) return { items: [], summary: { subtotal: 0, totalItems: 0 } };

  const subtotal = cart.items.reduce((sum, item) => {
    const price = item.variant
      ? (item.variant.discountPrice ?? item.variant.price)
      : (item.product.discountPrice ?? item.product.basePrice);
    return sum + price * item.quantity;
  }, 0);

  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    ...cart,
    summary: { subtotal, totalItems },
  };
};

export const addToCartService = async (
  userId: string,
  data: AddToCartInput,
) => {
  const cart = await getOrCreateCart(userId);

  const product = await prisma.product.findUnique({
    where: { id: data.productId },
  });
  if (!product) throw new AppError("Product not found", 404);
  if (product.status !== "ACTIVE")
    throw new AppError("Product is not available", 400);

  if (data.variantId) {
    const variant = await prisma.productVariant.findFirst({
      where: { id: data.variantId, productId: data.productId },
    });
    if (!variant) throw new AppError("Variant not found", 404);
    if (!variant.isActive) throw new AppError("Variant is not available", 400);
    if (variant.stock < data.quantity)
      throw new AppError("Insufficient stock", 400);
  } else {
    if (product.stock < data.quantity)
      throw new AppError("Insufficient stock", 400);
  }

  // if item already exists, update quantity
  const existing = await prisma.cartItem.findUnique({
    where: {
      cartId_productId_variantId: {
        cartId: cart.id,
        productId: data.productId,
        variantId: data.variantId ?? null,
      },
    },
  });

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + data.quantity },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: data.productId,
        variantId: data.variantId,
        quantity: data.quantity,
      },
    });
  }

  return buildCartResponse(userId);
};

export const updateCartItemService = async (
  userId: string,
  itemId: string,
  data: UpdateCartItemInput,
) => {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) throw new AppError("Cart not found", 404);

  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId: cart.id },
    include: {
      product: true,
      variant: true,
    },
  });
  if (!item) throw new AppError("Cart item not found", 404);

  const availableStock = item.variant ? item.variant.stock : item.product.stock;

  if (data.quantity > availableStock)
    throw new AppError("Insufficient stock", 400);

  await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity: data.quantity },
  });

  return buildCartResponse(userId);
};

export const removeFromCartService = async (userId: string, itemId: string) => {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) throw new AppError("Cart not found", 404);

  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId: cart.id },
  });
  if (!item) throw new AppError("Cart item not found", 404);

  await prisma.cartItem.delete({ where: { id: itemId } });
  return buildCartResponse(userId);
};

export const clearCartService = async (userId: string) => {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) throw new AppError("Cart not found", 404);

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  return true;
};

export const validateCouponService = async (
  userId: string,
  code: string,
  subtotal: number,
) => {
  const coupon = await prisma.coupon.findUnique({ where: { code } });

  if (!coupon) throw new AppError("Invalid coupon code", 404);
  if (!coupon.isActive) throw new AppError("Coupon is not active", 400);

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now)
    throw new AppError("Coupon is not valid yet", 400);
  if (coupon.expiresAt && coupon.expiresAt < now)
    throw new AppError("Coupon has expired", 400);
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
    throw new AppError("Coupon usage limit reached", 400);
  if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount)
    throw new AppError(
      `Minimum order amount is ${coupon.minOrderAmount} BDT`,
      400,
    );

  let discountAmount =
    coupon.type === "PERCENTAGE"
      ? (subtotal * coupon.value) / 100
      : coupon.value;

  if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
    discountAmount = coupon.maxDiscount;
  }

  return {
    couponId: coupon.id,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    discountAmount: Math.round(discountAmount * 100) / 100,
  };
};
