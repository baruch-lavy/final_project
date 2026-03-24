import express from "express";
import { auth } from "../middleware/auth.js";
import {
  getNotifications,
  markRead,
  markAllRead,
  getUnreadCount,
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", auth, getNotifications);
router.get("/unread-count", auth, getUnreadCount);
router.patch("/read-all", auth, markAllRead);
router.patch("/:id/read", auth, markRead);

export default router;
