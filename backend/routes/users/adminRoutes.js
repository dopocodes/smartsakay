const express = require("express");

const router = express.Router();

const { updateUserRole } = require("../../controllers/users/adminController");

const {
  protect,
  authorizeRoles,
} = require("../../middleware/users/authMiddleware");

router.patch(
  "/change-role",
  protect,
  authorizeRoles("admin", "superadmin"),
  updateUserRole,
);

module.exports = router;
