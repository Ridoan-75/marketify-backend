import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import { env } from "../config/index";
import { verifyAccessToken } from "../utils/generateToken";
import { prisma } from "../lib/prisma";
import { registerChatEvents } from "./events/chat.events";
import { registerNotificationEvents } from "./events/notification.events";

export let io: SocketServer;

export const initSocket = (httpServer: HttpServer): void => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  // auth middleware for socket
  io.use(async (socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];

      if (!token) return next(new Error("Authentication required"));

      const decoded = verifyAccessToken(token);

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          name: true,
          role: true,
          isActive: true,
          isBanned: true,
        },
      });

      if (!user || !user.isActive || user.isBanned) {
        return next(new Error("Unauthorized"));
      }

      socket.data.user = user;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = socket.data.user;
    console.log(`Socket connected: ${user.name} (${user.id})`);

    // join personal room for notifications
    socket.join(`user:${user.id}`);

    registerChatEvents(io, socket);
    registerNotificationEvents(io, socket);

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${user.name}`);
    });
  });
};
