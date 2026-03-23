import { Router } from "express";
import { auth, authorize } from "../middleware/auth.js";
import {
  getAssets,
  getAsset,
  createAsset,
  updateAsset,
  updateAssetLocation,
  deleteAsset,
  getAssetStats,
} from "../controllers/assetController.js";

const router = Router();

router.use(auth);

router.get("/stats", getAssetStats);
router.get("/", getAssets);
router.get("/:id", getAsset);
router.post("/", authorize("Commander", "Operator"), createAsset);
router.put("/:id", authorize("Commander", "Operator"), updateAsset);
router.put(
  "/:id/location",
  authorize("Commander", "Operator"),
  updateAssetLocation,
);
router.delete("/:id", authorize("Commander"), deleteAsset);

export default router;
