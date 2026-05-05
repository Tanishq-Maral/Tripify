import express, { Router } from "express";
import {
	signup,
	login,
	signupCreator,
	signupUser,
	loginCreator,
	loginUser,
	getProfile,
	updateProfileSettings,
} from "../controllers/authController.js";
import { firebaseLogin } from "../controllers/firebaseAuthController.js";
import { protect } from "../middleware/authMiddleware.js";

const router: Router = express.Router();


router.post("/firebase", firebaseLogin);
router.post("/signup", signup);
router.post("/login", login);
router.post("/signup/creator", signupCreator);
router.post("/signup/user", signupUser);
router.post("/login/creator", loginCreator);
router.post("/login/user", loginUser);
router.get("/profile", protect, getProfile);
router.put("/settings", protect, updateProfileSettings);

export default router;