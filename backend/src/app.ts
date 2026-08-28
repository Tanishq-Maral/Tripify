import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import tripRoutes from "./routes/tripRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import plannerRoutes from "./routes/plannerRoutes.js";

dotenv.config();
connectDB();

const app: Application = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        process.env.FRONTEND_URL,
        "http://localhost:5173",
        "http://127.0.0.1:5173"
      ].filter(Boolean);

      // Normalize origin (remove trailing slash)
      const normalizedOrigin = origin.replace(/\/$/, "");

      const isAllowed = allowedOrigins.some((allowed) =>
        normalizedOrigin === allowed?.replace(/\/$/, "")
      );

      if (isAllowed) return callback(null, true);

      console.log("Blocked by CORS:", origin); // debug
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/planner", plannerRoutes);

export default app;