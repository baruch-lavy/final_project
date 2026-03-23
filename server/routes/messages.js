import { Router } from "express";
import { auth } from "../middleware/auth.js";
import {
  getMessages,
  sendMessage,
  getChannels,
} from "../controllers/messageController.js";

const router = Router();

router.use(auth);

router.get("/channels", getChannels);
router.get("/:channel", getMessages);
router.post("/", sendMessage);

export default router;
