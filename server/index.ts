import dotenv from "dotenv";
import app, { connectDatabase } from "./app.js";

dotenv.config();

// Debug: Show which env vars are loaded (for debugging)
if (process.env.NODE_ENV !== "production") {
  const envVars = Object.keys(process.env).filter(key => 
    key.includes("MONGO") || key.includes("DATABASE") || key === "PORT"
  );
  console.log("📋 Environment variables found:", envVars.length > 0 ? envVars.join(", ") : "none");
}

const PORT = process.env.PORT || 3001;

// Connect to MongoDB and start server (for local development)
connectDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📡 API endpoint: http://localhost:${PORT}/api`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });
