import { Server as SocketServer, Socket } from "socket.io";
import { io } from "../socket.server";

export const registerNotificationEvents = (
  io: SocketServer,
  socket: Socket,
): void => {
  const userId = socket.data.user.id;

  socket.on("notification:ping", () => {
    socket.emit("notification:pong", { userId });
  });
};

// call this from anywhere in the app to push real-time notification
export const sendNotificationToUser = (
  userId: string,
  notification: {
    type: string;
    title: string;
    body: string;
    link?: string;
  },
): void => {
  if (!io) return;
  io.to(`user:${userId}`).emit("notification:new", notification);
};
