import { Server as SocketServer, Socket } from "socket.io";
import { prisma } from "../../lib/prisma";

export const registerChatEvents = (io: SocketServer, socket: Socket): void => {
  const userId = socket.data.user.id;

  // join a conversation room
  socket.on("chat:join", async (conversationId: string) => {
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });

    if (!participant) {
      socket.emit("chat:error", { message: "Conversation not found" });
      return;
    }

    socket.join(`conversation:${conversationId}`);
    socket.emit("chat:joined", { conversationId });
  });

  // leave conversation room
  socket.on("chat:leave", (conversationId: string) => {
    socket.leave(`conversation:${conversationId}`);
  });

  // send message via socket
  socket.on(
    "chat:send",
    async (data: {
      conversationId: string;
      content: string;
      type?: string;
    }) => {
      try {
        const participant = await prisma.conversationParticipant.findUnique({
          where: {
            conversationId_userId: {
              conversationId: data.conversationId,
              userId,
            },
          },
        });

        if (!participant) {
          socket.emit("chat:error", { message: "Conversation not found" });
          return;
        }

        const message = await prisma.message.create({
          data: {
            conversationId: data.conversationId,
            senderId: userId,
            content: data.content,
            type: (data.type as any) ?? "TEXT",
          },
          include: {
            sender: { select: { id: true, name: true, avatar: true } },
          },
        });

        await prisma.conversation.update({
          where: { id: data.conversationId },
          data: { updatedAt: new Date() },
        });

        // broadcast to all participants in the room
        io.to(`conversation:${data.conversationId}`).emit(
          "chat:message",
          message,
        );

        // notify participants who are not in the room
        const participants = await prisma.conversationParticipant.findMany({
          where: {
            conversationId: data.conversationId,
            userId: { not: userId },
          },
        });

        for (const p of participants) {
          io.to(`user:${p.userId}`).emit("chat:notification", {
            conversationId: data.conversationId,
            message: {
              content: data.content,
              sender: socket.data.user.name,
            },
          });
        }
      } catch (err) {
        socket.emit("chat:error", { message: "Failed to send message" });
      }
    },
  );

  // typing indicator
  socket.on("chat:typing", (data: { conversationId: string }) => {
    socket.to(`conversation:${data.conversationId}`).emit("chat:typing", {
      userId,
      name: socket.data.user.name,
    });
  });

  // stop typing
  socket.on("chat:stop_typing", (data: { conversationId: string }) => {
    socket.to(`conversation:${data.conversationId}`).emit("chat:stop_typing", {
      userId,
    });
  });

  // mark messages as read
  socket.on("chat:read", async (data: { conversationId: string }) => {
    await prisma.message.updateMany({
      where: {
        conversationId: data.conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    socket
      .to(`conversation:${data.conversationId}`)
      .emit("chat:read_receipt", {
        conversationId: data.conversationId,
        userId,
      });
  });
};
