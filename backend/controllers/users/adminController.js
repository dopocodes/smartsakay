const User = require("../../models/User");

// PATCH /api/admin/change-role
const updateUserRole = async (req, res) => {
  try {
    const { userIdToUpdate, newRole } = req.body;
    const requesterRole = req.user.role;

    const targetUser = await User.findById(userIdToUpdate);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const effectiveRole = newRole || targetUser.requested_role;

    if (effectiveRole === "superadmin" || targetUser.role === "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Superadmin role/accounts cannot be modified.",
      });
    }

    const validRoles = ["passenger", "driver", "admin"];
    if (!validRoles.includes(effectiveRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role specified.",
      });
    }

    if (
      (effectiveRole === "admin" || targetUser.role === "admin") &&
      requesterRole !== "superadmin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Only superadmins can manage admin accounts.",
      });
    }

    if (
      effectiveRole === "driver" &&
      !["superadmin", "admin"].includes(requesterRole)
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to approve driver accounts.",
      });
    }

    targetUser.role = effectiveRole;
    targetUser.account_status = "active";
    await targetUser.save();

    return res.status(200).json({
      success: true,
      message: `User approved and role updated to ${effectiveRole}.`,
      user: {
        id: targetUser._id,
        user_id: targetUser.user_id,
        first_name: targetUser.first_name,
        last_name: targetUser.last_name,
        email: targetUser.email,
        role: targetUser.role,
        requested_role: targetUser.requested_role,
        account_status: targetUser.account_status,
      },
    });
  } catch (error) {
    console.error("Update role error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while updating user role.",
    });
  }
};

module.exports = { updateUserRole };
