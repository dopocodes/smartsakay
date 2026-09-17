const routeSchema = new mongoose.Schema(
  {
    routeId: {
      type: String,
      unique: true,
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    origin: {
      name: String,
      coordinates: {
        type: [Number],
      },
    },

    destination: {
      name: String,
      coordinates: {
        type: [Number],
      },
    },

    stops: [
      {
        name: String,

        coordinates: {
          type: [Number],
        },
      },
    ],

    distanceKm: {
      type: Number,
    },

    estimatedTravelTimeMinutes: {
      type: Number,
    },

    fare: {
      regular: Number,
      student: Number,
      seniorCitizen: Number,
      pwd: Number,
    },

    vehicleTypes: [
      {
        type: String,
        enum: ["jeepney", "tricycle", "minibus"],
      },
    ],

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Route", routeSchema);
