import { prisma } from "../../lib/prisma";
import { AppError } from "../../errors/AppError";
import { paginate, paginateMeta } from "../../utils/paginate";

export const getWishlistService = async (
  userId: string,
  page = 1,
  limit = 12,
) => {
  const { skip, take } = paginate({ page, limit });

  const [items, total] = await Promise.all([
    prisma.wishlist.findMany({
      where: { userId },
      skip,
      take,
      orderBy: { addedAt: "desc" },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            basePrice: true,
            discountPrice: true,
            avgRating: true,
            reviewCount: true,
            stock: true,
            status: true,
            images: { where: { isPrimary: true }, take: 1 },
            seller: { select: { shopName: true, shopSlug: true } },
          },
        },
      },
    }),
    prisma.wishlist.count({ where: { userId } }),
  ]);

  return { items, meta: paginateMeta(total, page, limit) };
};

export const toggleWishlistService = async (
  userId: string,
  productId: string,
) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError("Product not found", 404);

  const existing = await prisma.wishlist.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  if (existing) {
    await prisma.wishlist.delete({
      where: { userId_productId: { userId, productId } },
    });
    return { action: "removed" };
  }

  await prisma.wishlist.create({ data: { userId, productId } });
  return { action: "added" };
};

export const checkWishlistService = async (
  userId: string,
  productId: string,
) => {
  const item = await prisma.wishlist.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  return { isWishlisted: !!item };
};
