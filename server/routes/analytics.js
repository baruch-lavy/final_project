import express from "express";
import { auth } from "../middleware/auth.js";
import {
  getDashboardAnalytics,
  getMissionHeatmap,
  getActivityTimeline,
} from "../controllers/analyticsController.js";

const router = express.Router();

router.get("/dashboard", auth, getDashboardAnalytics);
router.get("/heatmap", auth, getMissionHeatmap);
router.get("/timeline", auth, getActivityTimeline);

export default router;
