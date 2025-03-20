import mongoose from "mongoose";

// Cache the connection
let isConnected = false;

export async function connect() {
  // If already connected, use the existing connection
  if (isConnected) {
    console.log("MongoDB already connected");
    return;
  }

  // Check if MONGODB_URI is available
  if (!process.env.MONGO_URI) {
    throw new Error("MONGODB_URI not found in environment variables");
  }

  try {
    // Set mongoose options to avoid deprecation warnings

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    
    // Set connection flag
    isConnected = true;
    
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

// Add a disconnect function for testing/development
export async function disconnect() {
  if (!isConnected) {
    return;
  }
  
  await mongoose.disconnect();
  isConnected = false;
  console.log("MongoDB disconnected");
}