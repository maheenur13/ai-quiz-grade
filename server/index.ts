import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import quizRoutes from "./routes/quizRoutes.js";
import submissionRoutes from "./routes/submissionRoutes.js";

dotenv.config();

// Debug: Show which env vars are loaded (for debugging)
if (process.env.NODE_ENV !== "production") {
  const envVars = Object.keys(process.env).filter(key => 
    key.includes("MONGO") || key.includes("DATABASE") || key === "PORT"
  );
  console.log("📋 Environment variables found:", envVars.length > 0 ? envVars.join(", ") : "none");
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// Configure CORS to allow requests from frontend
const corsOptions: cors.CorsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5174',
      process.env.FRONTEND_URL,
      process.env.VITE_FRONTEND_URL,
      process.env.NETLIFY_URL,
    ].filter(Boolean) as string[];
    
    // Check if origin is allowed
    if (allowedOrigins.some(allowed => origin.includes(allowed)) || 
        origin.includes('netlify.app') || 
        origin.includes('localhost')) {
      callback(null, true);
    } else {
      // In production, you might want to be more strict
      if (process.env.NODE_ENV === 'production') {
        console.warn(`Blocked origin: ${origin}`);
      }
      callback(null, true); // Allow all for now, adjust as needed
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// MongoDB connection
// Try multiple possible environment variable names
const MONGODB_URI = 
  process.env.MONGODB_URI || 
  process.env.MONGO_URI || 
  process.env.MONGODB_URL || 
  process.env.DATABASE_URL || 
  "";

if (!MONGODB_URI) {
  console.error("❌ MongoDB URI is not set in environment variables");
  console.error("Please set one of the following in your .env file:");
  console.error("  - MONGODB_URI");
  console.error("  - MONGO_URI");
  console.error("  - MONGODB_URL");
  console.error("  - DATABASE_URL");
  
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB successfully");
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error.message);
    console.error("Please check your MongoDB URI and ensure MongoDB is running");
    process.exit(1);
  });

// Routes
app.use("/api/quizzes", quizRoutes);
app.use("/api/submissions", submissionRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "API is running" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api`);
});
