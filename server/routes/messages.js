const router = require("express").Router();
const { auth } = require("../middleware/auth");
const {
  getMessages,
  sendMessage,
  getChannels,
} = require("../controllers/messageController");

router.use(auth);

router.get("/channels", getChannels);
router.get("/:channel", getMessages);
router.post("/", sendMessage);

module.exports = router;
