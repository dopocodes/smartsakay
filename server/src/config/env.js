const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "/.env") });

const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/smartsakay",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-in-production",
  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-change-in-production",
  jwtAccessExpiry: "15m",
  jwtRefreshExpiry: "7d",
  gmail: {
    user: process.env.GMAIL_USER,
    appPassword: process.env.GMAIL_APP_PASSWORD,
  },
  smtp: {
    host: process.env.GMAIL_HOST,
    port: process.env.GMAIL_PORT,
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY,
  },
  weather: {
    apiKey: process.env.WEATHER_API_KEY,
  },
  admin: {
    email: process.env.ADMIN_EMAIL || "admin@smartsakay.com",
    defaultPassword: process.env.ADMIN_DEFAULT_PASSWORD || "Admin@12345",
  },
};

module.exports = config;
