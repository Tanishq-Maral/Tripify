import { Request, Response } from "express";
import Message from "../models/Message.js";
import Trip from "../models/Trip.js";

export const getMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (req.user.role !== "user") {
      res.status(403).json({ message: "Only users can access trip chat" });
      return;
    }

    const trip = await Trip.findById(req.params.tripId);
    if (!trip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }

    const isMember = trip.members.some((memberId) => String(memberId) === req.user?._id);
    if (!isMember) {
      res.status(403).json({ message: "You must join the trip before accessing chat" });
      return;
    }

    const messages = await Message.find({ trip: req.params.tripId })
      .populate("sender", "name email")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: "Error fetching messages", error: (error as Error).message });
  }
};