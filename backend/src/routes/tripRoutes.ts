import express, { Router } from "express";
import {
  getTrips,
  createTrip,
  getTripById,
  joinTrip,
  getFilterOptions,
  getTripMessages,
  sendTripMessage,
  updateTrip,
} from "../controllers/tripController.js";
import { protect } from "../middleware/authMiddleware.js";

const router: Router = express.Router();

router.get("/", getTrips);
router.get("/filters", getFilterOptions);
router.get("/:id", getTripById);
router.post("/", protect, createTrip);
router.post("/:id/join", protect, joinTrip);
router.put("/:id", protect, updateTrip);

router.get("/:id/messages", protect, getTripMessages);
router.post("/:id/messages", protect, sendTripMessage);

export default router;