const routeSchema = new mongoose.Schema(
  {
    route_id: {
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

    distance_km: {
      type: Number,
    },

    estimated_travel_time_minutes: {
      type: Number,
    },

    fare: {
      regular: Number,
      student: Number,
      seniorCitizen: Number,
      pwd: Number,
    },

    vehicle_types: [
      {
        type: String,
        enum: ["jeepney", "tricycle", "minibus", "taxi", "bus", "van"],
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
