import { prisma } from "../../lib/prisma";
import { AppError } from "../../errors/AppError";
import { CreateCouponInput, UpdateCouponInput } from "./coupon.validation";

export const createCouponService = async (
  userId: string,
  role: string,
  data: CreateCouponInput,
) => {
  const existing = await prisma.coupon.findUnique({
    where: { code: data.code },
  });
  if (existing) throw new AppError("Coupon code already exists", 409);

  let sellerId: string | null = null;

  if (role === "SELLER") {
    const seller = await prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw new AppError("Seller not found", 404);
    if (seller.status !== "APPROVED")
      throw new AppError("Your shop is not approved yet", 403);
    sellerId = seller.id;
  }

  return prisma.coupon.create({
    data: { ...data, sellerId },
  });
};

export const getMyCouponsService = async (userId: string, role: string) => {
  if (role === "ADMIN") {
    return prisma.coupon.findMany({
      where: { sellerId: null },
      orderBy: { createdAt: "desc" },
    });
  }

  const seller = await prisma.seller.findUnique({ where: { userId } });
  if (!seller) throw new AppError("Seller not found", 404);

  return prisma.coupon.findMany({
    where: { sellerId: seller.id },
    orderBy: { createdAt: "desc" },
  });
};

export const updateCouponService = async (
  userId: string,
  role: string,
  couponId: string,
  data: UpdateCouponInput,
) => {
  const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
  if (!coupon) throw new AppError("Coupon not found", 404);

  if (role === "SELLER") {
    const seller = await prisma.seller.findUnique({ where: { userId } });
    if (!seller || coupon.sellerId !== seller.id)
      throw new AppError("You do not have permission", 403);
  }

  return prisma.coupon.update({ where: { id: couponId }, data });
};

export const deleteCouponService = async (
  userId: string,
  role: string,
  couponId: string,
) => {
  const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
  if (!coupon) throw new AppError("Coupon not found", 404);

  if (role === "SELLER") {
    const seller = await prisma.seller.findUnique({ where: { userId } });
    if (!seller || coupon.sellerId !== seller.id)
      throw new AppError("You do not have permission", 403);
  }

  await prisma.coupon.delete({ where: { id: couponId } });
  return true;
};
