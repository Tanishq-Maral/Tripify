import { Request, Response } from "express";
import Message from "../models/Message.js";

export const getMessages = async (req: Request, res: Response): Promise<void> => {
  const messages = await Message.find({ tripId: req.params.tripId }).populate(
    "sender",
    "name email"
  );
  res.json(messages);
};