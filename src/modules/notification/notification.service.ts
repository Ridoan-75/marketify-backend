import { prisma } from "../../lib/prisma";
import { AppError } from "../../errors/AppError";
import { paginate, paginateMeta } from "../../utils/paginate";

type NotificationType =
  | "ORDER"
  | "PAYMENT"
  | "CHAT"
  | "REVIEW"
  | "SYSTEM"
  | "PROMOTION";

export const createNotificationService = async (
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  link?: string,
) => {
  return prisma.notification.create({
    data: { userId, type, title, body, link },
  });
};

export const getNotificationsService = async (
  userId: string,
  page = 1,
  limit = 20,
) => {
  const { skip, take } = paginate({ page, limit });

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      skip,
      take,
      orderBy: { createdAt: "desc" },
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return {
    notifications,
    unreadCount,
    meta: paginateMeta(total, page, limit),
  };
};

export const markAsReadService = async (
  userId: string,
  notificationId: string,
) => {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!notification) throw new AppError("Notification not found", 404);

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
};

export const markAllAsReadService = async (userId: string) => {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  return true;
};

export const deleteNotificationService = async (
  userId: string,
  notificationId: string,
) => {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!notification) throw new AppError("Notification not found", 404);

  await prisma.notification.delete({ where: { id: notificationId } });
  return true;
};
