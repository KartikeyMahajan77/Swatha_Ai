import mongoose from "mongoose";
import { logger } from "./logger";

export const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    const message =
      "MONGODB_URI is not set. Add your MongoDB Atlas connection string in Render environment variables.";
    logger.error(message);
    throw new Error(message);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    logger.info("Connected to MongoDB");
  } catch (error) {
    logger.error("MongoDB connection error:", error);
    throw error;
  }
};
