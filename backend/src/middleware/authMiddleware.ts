import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import User from "../models/User.js";

type AuthRole = "creator" | "user";

interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: AuthRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
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
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        res.status(401).json({ message: "User not found" });
        return;
      }
      req.user = {
        _id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
      };
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

export const authorizeRoles = (...roles: AuthRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: "You are not allowed to perform this action" });
      return;
    }

    next();
  };
};