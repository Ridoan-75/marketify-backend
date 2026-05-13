import { prisma } from "../../lib/prisma";
import { AppError } from "../../errors/AppError";
import { CreateReviewInput, UpdateReviewInput } from "./review.validation";

const updateProductRating = async (productId: string) => {
  const result = await prisma.review.aggregate({
    where: { productId, isHidden: false },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.product.update({
    where: { id: productId },
    data: {
      avgRating: Math.round((result._avg.rating ?? 0) * 10) / 10,
      reviewCount: result._count.rating,
    },
  });
};

export const createReviewService = async (
  userId: string,
  data: CreateReviewInput,
  imageUrls: string[],
) => {
  const product = await prisma.product.findUnique({
    where: { id: data.productId },
  });
  if (!product) throw new AppError("Product not found", 404);

  // check if user purchased this product
  const purchased = await prisma.orderItem.findFirst({
    where: {
      productId: data.productId,
      order: {
        userId,
        status: "DELIVERED",
      },
    },
  });

  const existing = await prisma.review.findUnique({
    where: { productId_userId: { productId: data.productId, userId } },
  });
  if (existing)
    throw new AppError("You have already reviewed this product", 409);

  const review = await prisma.review.create({
    data: {
      productId: data.productId,
      userId,
      rating: data.rating,
      comment: data.comment,
      images: imageUrls,
      isVerified: !!purchased,
    },
    include: {
      user: { select: { name: true, avatar: true } },
    },
  });

  await updateProductRating(data.productId);
  return review;
};

export const getProductReviewsService = async (
  productId: string,
  page = 1,
  limit = 10,
) => {
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { productId, isHidden: false },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, avatar: true } },
      },
    }),
    prisma.review.count({ where: { productId, isHidden: false } }),
  ]);

  const ratingBreakdown = await prisma.review.groupBy({
    by: ["rating"],
    where: { productId, isHidden: false },
    _count: { rating: true },
  });

  return {
    reviews,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    ratingBreakdown,
  };
};

export const updateReviewService = async (
  userId: string,
  reviewId: string,
  data: UpdateReviewInput,
) => {
  const review = await prisma.review.findFirst({
    where: { id: reviewId, userId },
  });
  if (!review) throw new AppError("Review not found", 404);

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data,
  });

  await updateProductRating(review.productId);
  return updated;
};

export const deleteReviewService = async (userId: string, reviewId: string) => {
  const review = await prisma.review.findFirst({
    where: { id: reviewId, userId },
  });
  if (!review) throw new AppError("Review not found", 404);

  await prisma.review.delete({ where: { id: reviewId } });
  await updateProductRating(review.productId);
  return true;
};

export const toggleReviewVisibilityService = async (reviewId: string) => {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new AppError("Review not found", 404);

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: { isHidden: !review.isHidden },
  });

  await updateProductRating(review.productId);
  return updated;
};

export const getMyReviewsService = async (userId: string) => {
  return prisma.review.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          images: { where: { isPrimary: true }, take: 1 },
        },
      },
    },
  });
};