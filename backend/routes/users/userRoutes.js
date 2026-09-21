const express = require("express");

const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../../controllers/users/userController");

const { isEmailVerified } = require("../../controllers/users/authController");

const {
  updateUserValidation,
  handleValidationErrors,
} = require("../../middleware/users/validateMiddleware");

const {
  protect,
  authorizeRoles,
} = require("../../middleware/users/authMiddleware");

const router = express.Router();

// GET /api/users
// Admin only
router.get("/", protect, authorizeRoles("admin"), isEmailVerified, getUsers);

// GET /api/users/:id
// Admin or the authenticated user
router.get(
  "/:id",
  protect,
  async (req, res, next) => {
    if (
      req.user.role === "admin" ||
      req.user._id.toString() === req.params.id
    ) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "You are not authorized to view this user.",
    });
  },
  getUserById,
);

// PUT /api/users/:id
// Admin or the user's own account
router.put(
  "/:id",
  protect,
  async (req, res, next) => {
    if (
      req.user.role === "admin" ||
      req.user.role === "superadmin" ||
      req.user._id.toString() === req.params.id
    ) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "You are not authorized to update this user.",
    });
  },
  updateUserValidation,
  handleValidationErrors,
  isEmailVerified,
  updateUser,
);

// DELETE /api/users/:id
// Admin only
router.delete("/:id", protect, authorizeRoles("admin"), deleteUser);

module.exports = router;
