import { Router } from "express";
import { body } from "express-validator";
import { auth, authorize } from "../middleware/auth.js";
import {
  getMissions,
  getMission,
  createMission,
  updateMission,
  updateMissionStatus,
  addMissionUpdate,
  deleteMission,
  getMissionStats,
} from "../controllers/missionController.js";

const router = Router();

router.use(auth);

router.get("/stats", getMissionStats);
router.get("/", getMissions);
router.get("/:id", getMission);

router.post(
  "/",
  authorize("Commander", "Operator"),
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required"),
    body("location.coordinates")
      .isArray({ min: 2, max: 2 })
      .withMessage("Location coordinates required"),
  ],
  createMission,
);

router.put("/:id", authorize("Commander", "Operator"), updateMission);
router.put(
  "/:id/status",
  authorize("Commander", "Operator"),
  updateMissionStatus,
);
router.post("/:id/updates", addMissionUpdate);
router.delete("/:id", authorize("Commander"), deleteMission);

export default router;
