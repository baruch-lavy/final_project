import { Router } from "express";
import { body } from "express-validator";
import {
  register,
  login,
  getMe,
  getUsers,
} from "../controllers/authController.js";
import { auth } from "../middleware/auth.js";

const router = Router();

router.post(
  "/register",
  [
    body("username")
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be 3-30 characters"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  register,
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  login,
);

router.get("/me", auth, getMe);
router.get("/users", auth, getUsers);

export default router;
