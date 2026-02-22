import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import User from "../models/User.js";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token: string | undefined;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
      req.user = await User.findById(decoded.id).select("-password");
      next();
      return;
    } catch (error) {
      res.status(401).json({ message: "Not authorized, token failed" });
      return;
    }
  }
  if (!token) {
    res.status(401).json({ message: "No token provided" });
  }
};