import { Server, Socket } from "socket.io";
import type { Server as HttpServer } from "http";

let io: Server | undefined;

export const initSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log("✅ User connected:", socket.id);

    socket.on("join_trip", (tripId: string) => {
      socket.join(tripId);
      console.log(`📍 User ${socket.id} joined trip room: ${tripId}`);
    });

    socket.on("leave_trip", (tripId: string) => {
      socket.leave(tripId);
      console.log(`🚪 User ${socket.id} left trip room: ${tripId}`);
    });

    socket.on("disconnect", (reason: string) => {
      console.log("🔌 User disconnected:", socket.id, "Reason:", reason);
    });

    socket.on("error", (error: Error) => {
      console.error("❌ Socket error:", error);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};