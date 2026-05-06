import { Request, Response } from "express";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

type UserRole = "creator" | "user";

const buildAuthResponse = (user: {
  _id: unknown;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
}) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  token: generateToken(String(user._id)),
});

const signupWithRole = async (req: Request, res: Response, role: UserRole): Promise<void> => {
  const { name, email, password, phone } = req.body as {
    name: string;
    email: string;
    password: string;
    phone?: string;
  };

  if (!name || !email || !password) {
    res.status(400).json({ message: "Name, email, and password are required" });
    return;
  }

  if (role === "creator" && !phone) {
    res.status(400).json({ message: "Phone number is required for creator accounts" });
    return;
  }

  if (phone && !/^[0-9]{10}$/.test(phone)) {
    res.status(400).json({ message: "Phone number must be exactly 10 digits" });
    return;
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      res.status(400).json({
        message: `This email is already registered as ${exists.role}. One email can belong to only one account type.`,
      });
      return;
    }

    const user = await User.create({ name, email: normalizedEmail, password, phone, role });
    res.status(201).json(buildAuthResponse(user));
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};

const loginWithRole = async (
  req: Request,
  res: Response,
  allowedRole?: UserRole
): Promise<void> => {
  const { email, password } = req.body as { email: string; password: string };

  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !(await user.matchPassword(password))) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    if (allowedRole && user.role !== allowedRole) {
      res.status(403).json({
        message: `This account is not registered as ${allowedRole}. Please use the correct login option.`,
      });
      return;
    }

    res.json(buildAuthResponse(user));
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};

export const signup = async (req: Request, res: Response): Promise<void> => {
  const role = ((req.body as { role?: UserRole }).role || "user") as UserRole;
  await signupWithRole(req, res, role === "creator" ? "creator" : "user");
};

export const signupCreator = async (req: Request, res: Response): Promise<void> => {
  await signupWithRole(req, res, "creator");
};

export const signupUser = async (req: Request, res: Response): Promise<void> => {
  await signupWithRole(req, res, "user");
};

export const login = async (req: Request, res: Response): Promise<void> => {
  await loginWithRole(req, res);
};

export const loginCreator = async (req: Request, res: Response): Promise<void> => {
  await loginWithRole(req, res, "creator");
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  await loginWithRole(req, res, "user");
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};

export const updateProfileSettings = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const { name, email, password, phone } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
  };

  if (phone && !/^[0-9]{10}$/.test(phone)) {
    res.status(400).json({ message: "Phone number must be exactly 10 digits" });
    return;
  }

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const normalizedEmail = email?.trim().toLowerCase();

    if (normalizedEmail && normalizedEmail !== user.email) {
      const exists = await User.findOne({ email: normalizedEmail });
      if (exists) {
        res.status(400).json({ message: "Email is already in use" });
        return;
      }
      user.email = normalizedEmail;
    }

    if (name) {
      user.name = name;
    }

    if (password) {
      user.password = password;
    }

    if (phone) {
      user.phone = phone;
    }

    await user.save();

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token: generateToken(String(user._id)),
    });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};