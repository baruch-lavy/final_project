const router = require("express").Router();
const { body } = require("express-validator");
const {
  register,
  login,
  getMe,
  getUsers,
} = require("../controllers/authController");
const { auth } = require("../middleware/auth");

router.post(
  "/register",
  [
    body("username")
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be 3-30 characters"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  register,
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  login,
);

router.get("/me", auth, getMe);
router.get("/users", auth, getUsers);

module.exports = router;
