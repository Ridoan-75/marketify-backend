import { Router } from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "./notification.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const notificationRouter = Router();

notificationRouter.use(authenticate);

notificationRouter.get("/", getNotifications);
notificationRouter.patch("/read-all", markAllAsRead);
notificationRouter.patch("/:id/read", markAsRead);
notificationRouter.delete("/:id", deleteNotification);

export { notificationRouter };
