const bookingSchema = new mongoose.Schema(
  {
    booking_id: {
      type: String,
      unique: true,
      required: true,
    },

    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
    },

    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Route",
      required: true,
    },

    pickup: {
      name: String,
      coordinates: [Number],
    },

    destination: {
      name: String,
      coordinates: [Number],
    },

    fare: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "in_progress", "completed", "cancelled"],
      default: "pending",
    },

    requested_at: {
      type: Date,
      default: Date.now,
    },

    completed_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Booking", bookingSchema);
