const app = require("./app");
const connectDB = require("./config/db");
const config = require("./config/env");

const startServer = async () => {
  await connectDB();
  app.listen(config.port, "0.0.0.0", () => {
    console.log(
      `SmartSakay Dagupan API running on port ${config.port} in ${config.nodeEnv} mode`,
    );
  });
};

startServer();
