import express, { Router } from "express";
import { signup, login } from "../controllers/authController.js";
import { firebaseLogin } from "../controllers/firebaseAuthController.js";

const router: Router = express.Router();


router.post("/firebase", firebaseLogin);
router.post("/signup", signup);
router.post("/login", login);

export default router;