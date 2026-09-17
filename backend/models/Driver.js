const driverSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    license_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    vehicle_type: {
      type: String,
      enum: ["jeepney", "tricycle", "minibus", "taxi", "bus", "van"],
      required: true,
    },

    plate_number: {
      type: String,
      required: true,
      unique: true,
    },

    assigned_route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Route",
    },

    license_image: {
      type: String,
    },

    verification_status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },

    availability_status: {
      type: String,
      enum: ["offline", "available", "on_trip"],
      default: "offline",
    },
  },
  {
    timestamps: true,
  },
);
module.exports = mongoose.model("Driver", driverSchema);
