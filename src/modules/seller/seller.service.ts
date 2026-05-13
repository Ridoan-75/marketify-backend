import { prisma } from "../../lib/prisma";
import { AppError } from "../../errors/AppError";
import { generateUniqueSlug } from "../../utils/slugify";
import { SellerRegisterInput, UpdateShopInput } from "./seller.validation";

export const registerSellerService = async (
  userId: string,
  data: SellerRegisterInput,
) => {
  const existing = await prisma.seller.findUnique({ where: { userId } });
  if (existing) throw new AppError("You already have a shop", 409);

  const shopSlug = await generateUniqueSlug(data.shopName, async (slug) => {
    const found = await prisma.seller.findUnique({ where: { shopSlug: slug } });
    return !!found;
  });

  const seller = await prisma.seller.create({
    data: {
      userId,
      shopSlug,
      ...data,
    },
  });

  // update user role to SELLER
  await prisma.user.update({
    where: { id: userId },
    data: { role: "SELLER" },
  });

  return seller;
};

export const getMyShopService = async (userId: string) => {
  const seller = await prisma.seller.findUnique({
    where: { userId },
    include: {
      user: {
        select: { name: true, email: true, avatar: true },
      },
    },
  });

  if (!seller) throw new AppError("Shop not found", 404);
  return seller;
};

export const getShopBySlugService = async (slug: string) => {
  const seller = await prisma.seller.findUnique({
    where: { shopSlug: slug },
    include: {
      user: {
        select: { name: true },
      },
      products: {
        where: { status: "ACTIVE" },
        take: 12,
        orderBy: { createdAt: "desc" },
        include: {
          images: {
            where: { isPrimary: true },
            take: 1,
          },
        },
      },
    },
  });

  if (!seller) throw new AppError("Shop not found", 404);
  if (seller.status !== "APPROVED")
    throw new AppError("This shop is not available", 403);

  return seller;
};

export const updateShopService = async (
  userId: string,
  data: UpdateShopInput,
) => {
  const seller = await prisma.seller.findUnique({ where: { userId } });
  if (!seller) throw new AppError("Shop not found", 404);

  return prisma.seller.update({
    where: { userId },
    data,
  });
};

export const updateShopLogoService = async (
  userId: string,
  logoUrl: string,
) => {
  const seller = await prisma.seller.findUnique({ where: { userId } });
  if (!seller) throw new AppError("Shop not found", 404);

  return prisma.seller.update({
    where: { userId },
    data: { shopLogo: logoUrl },
    select: { id: true, shopName: true, shopLogo: true },
  });
};

export const updateShopBannerService = async (
  userId: string,
  bannerUrl: string,
) => {
  const seller = await prisma.seller.findUnique({ where: { userId } });
  if (!seller) throw new AppError("Shop not found", 404);

  return prisma.seller.update({
    where: { userId },
    data: { shopBanner: bannerUrl },
    select: { id: true, shopName: true, shopBanner: true },
  });
};

export const getSellerDashboardService = async (userId: string) => {
  const seller = await prisma.seller.findUnique({ where: { userId } });
  if (!seller) throw new AppError("Shop not found", 404);

  const [
    totalProducts,
    totalOrders,
    pendingOrders,
    totalRevenue,
    recentOrders,
  ] = await Promise.all([
    prisma.product.count({
      where: { sellerId: seller.id },
    }),
    prisma.orderItem.count({
      where: { sellerId: seller.id },
    }),
    prisma.orderItem.count({
      where: { sellerId: seller.id, status: "PENDING" },
    }),
    prisma.orderItem.aggregate({
      where: {
        sellerId: seller.id,
        order: { payment: { status: "PAID" } },
      },
      _sum: { totalPrice: true },
    }),
    prisma.orderItem.findMany({
      where: { sellerId: seller.id },
      take: 5,
      orderBy: { order: { createdAt: "desc" } },
      include: {
        order: {
          select: {
            id: true,
            createdAt: true,
            user: { select: { name: true } },
          },
        },
        product: {
          select: { name: true },
        },
      },
    }),
  ]);

  return {
    shop: {
      id: seller.id,
      shopName: seller.shopName,
      shopSlug: seller.shopSlug,
      shopLogo: seller.shopLogo,
      status: seller.status,
      balance: seller.balance,
      rating: seller.rating,
      ratingCount: seller.ratingCount,
    },
    stats: {
      totalProducts,
      totalOrders,
      pendingOrders,
      totalRevenue: totalRevenue._sum.totalPrice ?? 0,
    },
    recentOrders,
  };
};

export const getFeaturedSellersService = async () => {
  return prisma.seller.findMany({
    where: { status: 'APPROVED' },
    take: 12,
    orderBy: [{ rating: 'desc' }, { totalSales: 'desc' }],
    select: {
      id: true,
      shopName: true,
      shopSlug: true,
      shopLogo: true,
      rating: true,
      ratingCount: true,
      totalSales: true,
      _count: { select: { products: true } },
    },
  });
};
