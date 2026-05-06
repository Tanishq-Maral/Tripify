import express, { Router } from "express";
import {
  getTrips,
  createTrip,
  getTripById,
  joinTrip,
  reportTripCreator,
  getFilterOptions,
  getTripMessages,
  sendTripMessage,
  updateTrip,
  removeTripMember,
} from "../controllers/tripController.js";
import { protect } from "../middleware/authMiddleware.js";

const router: Router = express.Router();

router.get("/", getTrips);
router.get("/filters", getFilterOptions);
router.get("/:id", getTripById);
router.post("/", protect, createTrip);
router.post("/:id/join", protect, joinTrip);
router.post("/:id/report", protect, reportTripCreator);
router.put("/:id", protect, updateTrip);
router.delete("/:id/members/:memberId", protect, removeTripMember);

router.get("/:id/messages", protect, getTripMessages);
router.post("/:id/messages", protect, sendTripMessage);

export default router;