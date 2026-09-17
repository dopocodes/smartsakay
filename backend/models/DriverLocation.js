const driverLocationSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver",
    required: true,
  },

  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },

    coordinates: {
      type: [Number],
      required: true,
    },
  },

  recordedAt: {
    type: Date,
    default: Date.now,
  },
});

driverLocationSchema.index({
  location: "2dsphere",
});
