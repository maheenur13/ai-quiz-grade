import serverless from "serverless-http";
import type { Handler, HandlerResponse } from "@netlify/functions";
import app, { connectDatabase } from "../../server/app.js";

// Connect to MongoDB when the function is invoked
let isConnected = false;

const handler = serverless(app, {
  binary: ["image/*", "application/pdf"],
});

export const api: Handler = async (event, context) => {
  // Ensure MongoDB connection on first invocation
  if (!isConnected) {
    try {
      await connectDatabase();
      isConnected = true;
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Database connection failed" }),
      } as HandlerResponse;
    }
  }

  // Call the serverless handler
  const result = await handler(event, context);
  return result as HandlerResponse;
};
