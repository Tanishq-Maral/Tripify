import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import tripRoutes from "./routes/tripRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

dotenv.config();
connectDB();

const app: Application = express();

app.use(
  // Allow local development and the production frontend domain configured via FRONTEND_URL
  // FRONTEND_URL should be e.g. "https://your-frontend.vercel.app"
  (() => {
    const allowedOrigins = [process.env.FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"].filter(Boolean) as string[];
    return cors({
      origin: (origin, callback) => {
        // allow requests with no origin like curl or server-to-server
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("CORS policy: Origin not allowed"), false);
      },
      credentials: true,
    });
  })()
);
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/chat", chatRoutes);

export default app;