import { Router } from "express";
import { auth } from "../middleware/auth.js";
import {
  getEvents,
  getDashboardStats,
} from "../controllers/eventController.js";

const router = Router();

router.use(auth);

router.get("/dashboard", getDashboardStats);
router.get("/", getEvents);

export default router;
