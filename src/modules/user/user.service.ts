import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../errors/AppError";
import {
  UpdateProfileInput,
  ChangePasswordInput,
  CreateAddressInput,
  UpdateAddressInput,
} from "./user.validation";

export const getProfileService = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatar: true,
      role: true,
      provider: true,
      isEmailVerified: true,
      createdAt: true,
    },
  });

  if (!user) throw new AppError("User not found", 404);
  return user;
};

export const updateProfileService = async (
  userId: string,
  data: UpdateProfileInput,
) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatar: true,
      role: true,
    },
  });

  return user;
};

export const updateAvatarService = async (
  userId: string,
  avatarUrl: string,
) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { avatar: avatarUrl },
    select: { id: true, name: true, avatar: true },
  });

  return user;
};

export const changePasswordService = async (
  userId: string,
  data: ChangePasswordInput,
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.password) throw new AppError("User not found", 404);

  const isMatch = await bcrypt.compare(data.currentPassword, user.password);
  if (!isMatch) throw new AppError("Current password is incorrect", 400);

  const hashed = await bcrypt.hash(data.newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });

  return true;
};

// ---- Address ----

export const getAddressesService = async (userId: string) => {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
};

export const createAddressService = async (
  userId: string,
  data: CreateAddressInput,
) => {
  // if new address is default, unset others
  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  // if first address, make it default automatically
  const count = await prisma.address.count({ where: { userId } });

  return prisma.address.create({
    data: {
      ...data,
      userId,
      isDefault: data.isDefault ?? count === 0,
    },
  });
};

export const updateAddressService = async (
  userId: string,
  addressId: string,
  data: UpdateAddressInput,
) => {
  const address = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });
  if (!address) throw new AppError("Address not found", 404);

  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  return prisma.address.update({
    where: { id: addressId },
    data,
  });
};

export const deleteAddressService = async (
  userId: string,
  addressId: string,
) => {
  const address = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });
  if (!address) throw new AppError("Address not found", 404);

  await prisma.address.delete({ where: { id: addressId } });
  return true;
};

export const setDefaultAddressService = async (
  userId: string,
  addressId: string,
) => {
  const address = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });
  if (!address) throw new AppError("Address not found", 404);

  await prisma.address.updateMany({
    where: { userId },
    data: { isDefault: false },
  });

  return prisma.address.update({
    where: { id: addressId },
    data: { isDefault: true },
  });
};
