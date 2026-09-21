const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },

    first_name: {
      type: String,
      required: true,
      trim: true,
    },

    last_name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    mobile_number: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      trim: true,
    },

    barangay: {
      type: String,
      trim: true,
    },

    birth_date: {
      type: Date,
    },

    role: {
      type: String,
      enum: ["passenger", "driver", "admin", "superadmin"],
      default: "passenger",
    },

    requested_role: {
      type: String,
      enum: ["passenger", "driver", "admin", "superadmin"],
      default: "passenger",
    },

    passenger_category: {
      type: String,
      enum: ["regular", "student", "senior_citizen", "pwd"],
      default: "regular",
    },

    email_verified: {
      type: Boolean,
      default: false,
    },

    account_status: {
      type: String,
      enum: ["active", "suspended", "pending", "superadmin"],
      default: "pending",
    },

    profile_image: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
