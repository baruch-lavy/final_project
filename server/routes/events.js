const router = require("express").Router();
const { auth } = require("../middleware/auth");
const {
  getEvents,
  getDashboardStats,
} = require("../controllers/eventController");

router.use(auth);

router.get("/dashboard", getDashboardStats);
router.get("/", getEvents);

module.exports = router;
