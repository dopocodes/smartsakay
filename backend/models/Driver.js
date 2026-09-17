const driverSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    licenseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    licenseImage: {
      type: String,
      required: true,
    },

    vehicleType: {
      type: String,
      enum: ["jeepney", "tricycle", "minibus", "taxi", "bus", "van"],
      required: true,
    },

    plateNumber: {
      type: String,
      required: true,
      unique: true,
    },

    assignedRoute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Route",
    },

    licenseImage: {
      type: String,
    },

    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },

    availabilityStatus: {
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
