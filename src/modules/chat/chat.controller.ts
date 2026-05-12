import { Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendResponse } from "../../utils/sendResponse";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  startConversationService,
  getMyConversationsService,
  getConversationMessagesService,
  sendMessageService,
  deleteMessageService,
  getUnreadCountService,
} from "./chat.service";

export const startConversation = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const conversation = await startConversationService(req.user!.id, req.body);
    sendResponse({
      res,
      statusCode: 201,
      message: "Conversation started.",
      data: conversation,
    });
  },
);

export const getMyConversations = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await getMyConversationsService(req.user!.id, page, limit);
    sendResponse({
      res,
      message: "Conversations fetched.",
      data: result.conversations,
      meta: result.meta,
    });
  },
);

export const getConversationMessages = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 30;
    const result = await getConversationMessagesService(
      req.user!.id,
      req.params.conversationId as string,
      page,
      limit,
    );
    sendResponse({
      res,
      message: "Messages fetched.",
      data: result.messages,
      meta: result.meta,
    });
  },
);

export const sendMessage = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const fileUrl = req.file
      ? (req.file as Express.Multer.File & { path: string }).path
      : undefined;

    const message = await sendMessageService(
      req.user!.id,
      req.params.conversationId as string,
      req.body,
      fileUrl,
    );
    sendResponse({
      res,
      statusCode: 201,
      message: "Message sent.",
      data: message,
    });
  },
);

export const deleteMessage = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const message = await deleteMessageService(
      req.user!.id,
      req.params.messageId as string,
    );
    sendResponse({ res, message: "Message deleted.", data: message });
  },
);

export const getUnreadCount = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await getUnreadCountService(req.user!.id);
    sendResponse({ res, message: "Unread count fetched.", data: result });
  },
);
