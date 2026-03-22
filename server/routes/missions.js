const router = require("express").Router();
const { body } = require("express-validator");
const { auth, authorize } = require("../middleware/auth");
const {
  getMissions,
  getMission,
  createMission,
  updateMission,
  updateMissionStatus,
  addMissionUpdate,
  deleteMission,
  getMissionStats,
} = require("../controllers/missionController");

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

module.exports = router;
