const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const authRoutes = require("./backend/routes/users/authRoutes");
const userRoutes = require("./backend/routes/users/userRoutes");
const adminRoutes = require("./backend/routes/users/adminRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

// -----------------------------
// Global Middleware
// -----------------------------

app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "10kb" }));

// Handle invalid JSON body syntax errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON format in request body.",
    });
  }
  next();
});

app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// -----------------------------
// Health Check
// -----------------------------

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running.",
  });
});

// -----------------------------
// Routes
// -----------------------------

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

// -----------------------------
// 404 Handler
// -----------------------------

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});

// -----------------------------
// Global Error Handler
// -----------------------------

app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
});

// -----------------------------
// Database Connection
// -----------------------------

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully.");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

connectDB();
