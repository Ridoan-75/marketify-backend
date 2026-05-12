import { Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendResponse } from "../../utils/sendResponse";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  getNotificationsService,
  markAsReadService,
  markAllAsReadService,
  deleteNotificationService,
} from "./notification.service";

export const getNotifications = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await getNotificationsService(req.user!.id, page, limit);
    sendResponse({
      res,
      message: "Notifications fetched successfully.",
      data: {
        notifications: result.notifications,
        unreadCount: result.unreadCount,
      },
      meta: result.meta,
    });
  },
);

export const markAsRead = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    await markAsReadService(req.user!.id, req.params.id as string);
    sendResponse({ res, message: "Notification marked as read." });
  },
);

export const markAllAsRead = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    await markAllAsReadService(req.user!.id);
    sendResponse({ res, message: "All notifications marked as read." });
  },
);

export const deleteNotification = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    await deleteNotificationService(req.user!.id, req.params.id as string);
    sendResponse({ res, message: "Notification deleted." });
  },
);
