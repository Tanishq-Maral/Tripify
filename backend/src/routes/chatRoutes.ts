import express, { Router } from "express";
import { getMessages } from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router: Router = express.Router();

router.get("/:tripId/messages", protect, getMessages);

export default router;