import { Request, Response } from "express";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

export const signup = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body as { name: string; email: string; password: string };
  try {
    const exists = await User.findOne({ email });
    if (exists) {
      res.status(400).json({ message: "User already exists" });
      return;
    }
    const user = await User.create({ name, email, password });
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(String(user._id)),
    });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email: string; password: string };
  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(String(user._id)),
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};