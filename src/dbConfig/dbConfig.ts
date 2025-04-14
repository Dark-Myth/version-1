/* eslint-disable @typescript-eslint/no-require-imports */
import mongoose from "mongoose";

// Cache the connection
let isConnected = false;

// Function to pre-load all required models in the correct order
const preloadModels = () => {
  try {
    // First load base models that don't depend on other models
    if (!mongoose.models.teams) {
      require("@/models/teamsModel");
      console.log("Teams model loaded");
    }
    
    if (!mongoose.models.tournaments) {
      require("@/models/tournamentsModel");
      console.log("Tournaments model loaded");
    }
    
    if (!mongoose.models.players) {
      require("@/models/playersModel");
      console.log("Players model loaded");
    }
    
    if (!mongoose.models.users) {
      require("@/models/userModel");
      console.log("Users model loaded");
    }
    
    // Load schema-only models
    require("@/models/ballsModel");
    console.log("Ball schema loaded");
    
    // Then load models that depend on the base models and schemas
    if (!mongoose.models.matches) {
      require("@/models/matchesModel");
      console.log("Matches model loaded");
    }
    
    if (!mongoose.models.innings) {
      require("@/models/inningsModel");
      console.log("Innings model loaded");
    }
    
    if (!mongoose.models.overs) {
      require("@/models/oversModel");
      console.log("Overs model loaded");
    }
    
    if (!mongoose.models.playerstats) {
      require("@/models/playerstatsModel");
      console.log("Player Stats model loaded");
    }
    
    if (!mongoose.models.pointstables) {
      require("@/models/pointstablesModel");
      console.log("Points Tables model loaded");
    }
    
    console.log("All models successfully loaded");
  } catch (error) {
    console.error("Error loading models:", error);
  }
};

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
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    
    // Set connection flag
    isConnected = true;
    
    // Preload all models to ensure they're registered in the correct order
    preloadModels();
    
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