const router = require("express").Router();
const { auth, authorize } = require("../middleware/auth");
const {
  getAssets,
  getAsset,
  createAsset,
  updateAsset,
  updateAssetLocation,
  deleteAsset,
  getAssetStats,
} = require("../controllers/assetController");

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

module.exports = router;
