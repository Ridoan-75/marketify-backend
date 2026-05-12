import { prisma } from "../../lib/prisma";
import { AppError } from "../../errors/AppError";
import { paginate, paginateMeta } from "../../utils/paginate";
import { StartConversationInput, SendMessageInput } from "./chat.validation";

export const startConversationService = async (
  userId: string,
  data: StartConversationInput,
) => {
  const seller = await prisma.seller.findUnique({
    where: { id: data.sellerId },
    include: { user: true },
  });
  if (!seller) throw new AppError("Seller not found", 404);
  if (seller.userId === userId)
    throw new AppError("You cannot message your own shop", 400);

  // check if conversation already exists between user and seller for this product
  const existing = await prisma.conversation.findFirst({
    where: {
      productId: data.productId ?? null,
      participants: {
        every: {
          userId: { in: [userId, seller.userId] },
        },
      },
    },
    include: {
      participants: true,
      messages: {
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          sender: { select: { id: true, name: true, avatar: true } },
        },
      },
    },
  });

  if (existing) {
    // send new message to existing conversation
    await prisma.message.create({
      data: {
        conversationId: existing.id,
        senderId: userId,
        content: data.message,
        type: "TEXT",
      },
    });

    await prisma.conversation.update({
      where: { id: existing.id },
      data: { updatedAt: new Date() },
    });

    return existing;
  }

  // create new conversation
  const conversation = await prisma.conversation.create({
    data: {
      productId: data.productId,
      participants: {
        create: [{ userId }, { userId: seller.userId }],
      },
      messages: {
        create: {
          senderId: userId,
          content: data.message,
          type: "TEXT",
        },
      },
    },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
      },
      messages: {
        include: {
          sender: { select: { id: true, name: true, avatar: true } },
        },
      },
    },
  });

  return conversation;
};

export const getMyConversationsService = async (
  userId: string,
  page = 1,
  limit = 20,
) => {
  const { skip, take } = paginate({ page, limit });

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where: {
        participants: { some: { userId } },
      },
      skip,
      take,
      orderBy: { updatedAt: "desc" },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: {
            content: true,
            type: true,
            createdAt: true,
            isRead: true,
            senderId: true,
          },
        },
      },
    }),
    prisma.conversation.count({
      where: { participants: { some: { userId } } },
    }),
  ]);

  return { conversations, meta: paginateMeta(total, page, limit) };
};

export const getConversationMessagesService = async (
  userId: string,
  conversationId: string,
  page = 1,
  limit = 30,
) => {
  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: { conversationId, userId },
    },
  });
  if (!participant) throw new AppError("Conversation not found", 404);

  const { skip, take } = paginate({ page, limit });

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId, isDeleted: false },
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    }),
    prisma.message.count({
      where: { conversationId, isDeleted: false },
    }),
  ]);

  // mark messages as read
  await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: userId },
      isRead: false,
    },
    data: { isRead: true },
  });

  // update lastReadAt
  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { lastReadAt: new Date() },
  });

  return {
    messages: messages.reverse(),
    meta: paginateMeta(total, page, limit),
  };
};

export const sendMessageService = async (
  userId: string,
  conversationId: string,
  data: SendMessageInput,
  fileUrl?: string,
) => {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!participant) throw new AppError("Conversation not found", 404);

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: userId,
      content: data.content,
      type: data.type,
      fileUrl,
    },
    include: {
      sender: { select: { id: true, name: true, avatar: true } },
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return message;
};

export const deleteMessageService = async (
  userId: string,
  messageId: string,
) => {
  const message = await prisma.message.findFirst({
    where: { id: messageId, senderId: userId },
  });
  if (!message) throw new AppError("Message not found", 404);

  return prisma.message.update({
    where: { id: messageId },
    data: { isDeleted: true, content: "This message was deleted." },
  });
};

export const getUnreadCountService = async (userId: string) => {
  const count = await prisma.message.count({
    where: {
      conversation: {
        participants: { some: { userId } },
      },
      senderId: { not: userId },
      isRead: false,
      isDeleted: false,
    },
  });

  return { unreadCount: count };
};
