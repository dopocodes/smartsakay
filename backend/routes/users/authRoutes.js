const express = require("express");

const {
  register,
  login,
  roleCheck,
} = require("../../controllers/users/authController");

const {
  registerValidation,
  loginValidation,
  handleValidationErrors,
} = require("../../middleware/users/validateMiddleware");

const {
  protect,
  authorizeRoles,
} = require("../../middleware/users/authMiddleware");

const router = express.Router();

router.post("/register", registerValidation, handleValidationErrors, register);

router.post("/login", loginValidation, handleValidationErrors, login);

router.get("/role-check", protect, roleCheck);

router.get(
  "/all-users",
  protect,
  authorizeRoles("passenger", "driver", "admin"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Welcome SmartSakay user.",
    });
  },
);

router.get("/driver", protect, authorizeRoles("driver"), (req, res) => {
  res.status(200).json({
    success: true,
    message: "Accessible by drivers only.",
  });
});

router.get("/admin", protect, authorizeRoles("admin"), (req, res) => {
  res.status(200).json({
    success: true,
    message: "Accessible by admins only.",
  });
});

module.exports = router;
