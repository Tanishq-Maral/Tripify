import express, { Router } from "express";
import { getPlannerHistory, planTrip } from "../controllers/plannerController.js";
import { protect } from "../middleware/authMiddleware.js";

const router: Router = express.Router();

router.get("/history", protect, getPlannerHistory);
router.post("/", protect, planTrip);

export default router;