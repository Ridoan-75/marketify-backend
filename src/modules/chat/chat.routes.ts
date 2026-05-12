import { Router } from "express";
import {
  startConversation,
  getMyConversations,
  getConversationMessages,
  sendMessage,
  deleteMessage,
  getUnreadCount,
} from "./chat.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { uploadProduct } from "../../middlewares/upload.middleware";
import { startConversationSchema, sendMessageSchema } from "./chat.validation";

const chatRouter = Router();

chatRouter.use(authenticate);

chatRouter.post(
  "/conversations",
  validate(startConversationSchema),
  startConversation,
);
chatRouter.get("/conversations", getMyConversations);
chatRouter.get(
  "/conversations/:conversationId/messages",
  getConversationMessages,
);
chatRouter.post(
  "/conversations/:conversationId/messages",
  uploadProduct.single("file"),
  validate(sendMessageSchema),
  sendMessage,
);
chatRouter.delete("/messages/:messageId", deleteMessage);
chatRouter.get("/unread-count", getUnreadCount);

export { chatRouter };
