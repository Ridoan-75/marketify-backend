import { prisma } from "../../lib/prisma";
import { AppError } from "../../errors/AppError";
import { paginate, paginateMeta } from "../../utils/paginate";

export const getAdminDashboardService = async () => {
  const [
    totalUsers,
    totalSellers,
    totalProducts,
    totalOrders,
    pendingSellerApprovals,
    totalRevenue,
    recentOrders,
    topProducts,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }),
    prisma.seller.count(),
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.order.count(),
    prisma.seller.count({ where: { status: "PENDING" } }),
    prisma.payment.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true },
    }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        payment: { select: { method: true, status: true, amount: true } },
      },
    }),
    prisma.product.findMany({
      take: 5,
      orderBy: { totalSold: "desc" },
      select: {
        id: true,
        name: true,
        totalSold: true,
        avgRating: true,
        images: { where: { isPrimary: true }, take: 1 },
      },
    }),
  ]);

  return {
    stats: {
      totalUsers,
      totalSellers,
      totalProducts,
      totalOrders,
      pendingSellerApprovals,
      totalRevenue: totalRevenue._sum.amount ?? 0,
    },
    recentOrders,
    topProducts,
  };
};

export const getAllUsersService = async (
  page = 1,
  limit = 20,
  search?: string,
) => {
  const { skip, take } = paginate({ page, limit });

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        isBanned: true,
        isEmailVerified: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, meta: paginateMeta(total, page, limit) };
};

export const banUserService = async (userId: string, reason: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("User not found", 404);
  if (user.role === "ADMIN") throw new AppError("Cannot ban an admin", 403);

  return prisma.user.update({
    where: { id: userId },
    data: { isBanned: true, bannedReason: reason },
    select: { id: true, name: true, email: true, isBanned: true },
  });
};

export const unbanUserService = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("User not found", 404);

  return prisma.user.update({
    where: { id: userId },
    data: { isBanned: false, bannedReason: null },
    select: { id: true, name: true, email: true, isBanned: true },
  });
};

export const getPendingSellersService = async (page = 1, limit = 20) => {
  const { skip, take } = paginate({ page, limit });

  const [sellers, total] = await Promise.all([
    prisma.seller.findMany({
      where: { status: "PENDING" },
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true, phone: true } },
      },
    }),
    prisma.seller.count({ where: { status: "PENDING" } }),
  ]);

  return { sellers, meta: paginateMeta(total, page, limit) };
};

export const getAllSellersService = async (
  page = 1,
  limit = 20,
  search?: string,
) => {
  const { skip, take } = paginate({ page, limit });

  const where = search
    ? { shopName: { contains: search, mode: "insensitive" as const } }
    : {};

  const [sellers, total] = await Promise.all([
    prisma.seller.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { products: true, orderItems: true } },
      },
    }),
    prisma.seller.count({ where }),
  ]);

  return { sellers, meta: paginateMeta(total, page, limit) };
};

export const approveSellerService = async (sellerId: string) => {
  const seller = await prisma.seller.findUnique({ where: { id: sellerId } });
  if (!seller) throw new AppError("Seller not found", 404);

  return prisma.seller.update({
    where: { id: sellerId },
    data: { status: "APPROVED", rejectedReason: null },
  });
};

export const rejectSellerService = async (sellerId: string, reason: string) => {
  const seller = await prisma.seller.findUnique({ where: { id: sellerId } });
  if (!seller) throw new AppError("Seller not found", 404);

  return prisma.seller.update({
    where: { id: sellerId },
    data: { status: "REJECTED", rejectedReason: reason },
  });
};

export const suspendSellerService = async (
  sellerId: string,
  reason: string,
) => {
  const seller = await prisma.seller.findUnique({ where: { id: sellerId } });
  if (!seller) throw new AppError("Seller not found", 404);

  return prisma.seller.update({
    where: { id: sellerId },
    data: { status: "SUSPENDED", rejectedReason: reason },
  });
};

export const getAllOrdersService = async (
  page = 1,
  limit = 20,
  status?: string,
) => {
  const { skip, take } = paginate({ page, limit });

  const where = status ? { status: status as any } : {};

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        payment: { select: { method: true, status: true, amount: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, meta: paginateMeta(total, page, limit) };
};

export const getAllProductsAdminService = async (
  page = 1,
  limit = 20,
  status?: string,
) => {
  const { skip, take } = paginate({ page, limit });

  const where = status ? { status: status as any } : {};

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        seller: { select: { shopName: true } },
        category: { select: { name: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return { products, meta: paginateMeta(total, page, limit) };
};

export const updateProductStatusAdminService = async (
  productId: string,
  status: "ACTIVE" | "INACTIVE" | "REJECTED",
) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError("Product not found", 404);

  return prisma.product.update({
    where: { id: productId },
    data: { status },
  });
};


export const confirmCODPaymentService = async (orderId: string) => {
  const payment = await prisma.payment.findUnique({ where: { orderId } });
  if (!payment) throw new AppError("Payment not found", 404);
  if (payment.method !== "COD") throw new AppError("Not a COD order", 400);
  if (payment.status === "PAID")
    throw new AppError("Already marked as paid", 400);

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { orderId },
      data: { status: "PAID", paidAt: new Date() },
    });

    await tx.order.update({
      where: { id: orderId },
      data: { status: "DELIVERED" },
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

  return true;
};
