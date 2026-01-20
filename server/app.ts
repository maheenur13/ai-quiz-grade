import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import quizRoutes from "./routes/quizRoutes.js";
import submissionRoutes from "./routes/submissionRoutes.js";

// Create Express app
const app = express();

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
      'https://quizegrade.netlify.app', // Your Netlify frontend
      process.env.FRONTEND_URL,
      process.env.VITE_FRONTEND_URL,
      process.env.NETLIFY_URL,
      process.env.URL, // Netlify provides this
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

// MongoDB connection function
export async function connectDatabase() {
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
    
    throw new Error("MongoDB URI is not configured");
  }

  // Check if already connected
  if (mongoose.connection.readyState === 1) {
    console.log("✅ Already connected to MongoDB");
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error instanceof Error ? error.message : "Unknown error");
    throw error;
  }
}

// Routes
app.use("/api/quizzes", quizRoutes);
app.use("/api/submissions", submissionRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "API is running" });
});

export default app;
