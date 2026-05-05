import { Request, Response } from "express";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import admin from "firebase-admin";

let firebaseInitError: string | null = null;

const initializeFirebaseAdmin = (): boolean => {
  if (admin.apps.length > 0) {
    return true;
  }

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      firebaseInitError = null;
      return true;
    }

    firebaseInitError =
      "Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in backend env.";
    return false;
  } catch (err) {
    firebaseInitError = (err as Error).message;
    return false;
  }
};

export const firebaseLogin = async (req: Request, res: Response): Promise<void> => {
  const { idToken } = req.body as { idToken: string };

  if (!idToken) {
    res.status(400).json({ message: "Missing Firebase ID token" });
    return;
  }

  if (!initializeFirebaseAdmin()) {
    res.status(500).json({ message: firebaseInitError || "Firebase Admin initialization failed" });
    return;
  }

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const email = decoded.email;

    if (!email) {
      res.status(400).json({ message: "No email found in Google account" });
      return;
    }

    let user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({
        message: "Google login is only available for existing accounts. Please sign up first.",
      });
      return;
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(String(user._id)),
    });
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired Google token" });
  }
};
