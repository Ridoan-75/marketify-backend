import { prisma } from "../../lib/prisma";
import { AppError } from "../../errors/AppError";
import { CreateBannerInput, UpdateBannerInput } from "./banner.validation";

export const createBannerService = async (
  data: CreateBannerInput,
  imageUrl: string,
  mobileImageUrl?: string,
) => {
  return prisma.banner.create({
    data: {
      ...data,
      imageUrl,
      mobileImage: mobileImageUrl,
    },
  });
};

export const getActiveBannersService = async (position?: string) => {
  const now = new Date();
  return prisma.banner.findMany({
    where: {
      isActive: true,
      ...(position && { position: position as any }),
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    },
    orderBy: { sortOrder: "asc" },
  });
};

export const getAllBannersService = async () => {
  return prisma.banner.findMany({
    orderBy: [{ position: "asc" }, { sortOrder: "asc" }],
  });
};

export const updateBannerService = async (
  id: string,
  data: UpdateBannerInput,
  imageUrl?: string,
  mobileImageUrl?: string,
) => {
  const banner = await prisma.banner.findUnique({ where: { id } });
  if (!banner) throw new AppError("Banner not found", 404);

  return prisma.banner.update({
    where: { id },
    data: {
      ...data,
      ...(imageUrl && { imageUrl }),
      ...(mobileImageUrl && { mobileImage: mobileImageUrl }),
    },
  });
};

export const deleteBannerService = async (id: string) => {
  const banner = await prisma.banner.findUnique({ where: { id } });
  if (!banner) throw new AppError("Banner not found", 404);

  await prisma.banner.delete({ where: { id } });
  return true;
};

export const reorderBannersService = async (
  banners: { id: string; sortOrder: number }[],
) => {
  await Promise.all(
    banners.map((b) =>
      prisma.banner.update({
        where: { id: b.id },
        data: { sortOrder: b.sortOrder },
      }),
    ),
  );
  return true;
};
