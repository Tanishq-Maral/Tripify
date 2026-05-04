import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Get socket server URL from env, default to localhost for dev
      const socketUrl = (() => {
        const apiUrl = import.meta.env.VITE_API_URL?.trim() || "http://localhost:5000";
        // Convert http/https to ws/wss
        if (apiUrl.startsWith("https://")) {
          return apiUrl.replace("https://", "wss://");
        }
        if (apiUrl.startsWith("http://")) {
          return apiUrl.replace("http://", "ws://");
        }
        return apiUrl;
      })();

      const newSocket: Socket = io(socketUrl, {
        withCredentials: true,
        transports: ["websocket", "polling"],
      });

      newSocket.on("connect", () => {
        console.log("✅ Socket connected successfully");
      });

      newSocket.on("connect_error", (error: Error) => {
        console.error("❌ Socket connection error:", error);
      });

      newSocket.on("disconnect", (reason: string) => {
        console.log("🔌 Socket disconnected:", reason);
      });

      setSocket(newSocket);

      return () => {
        console.log("🧹 Cleaning up socket connection");
        newSocket.disconnect();
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): Socket | null => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};