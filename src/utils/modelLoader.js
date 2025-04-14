import mongoose from "mongoose";

/**
 * Ensures that all models are loaded in the correct order to prevent reference issues
 * This is particularly important for models that reference each other
 */
export function ensureModelsLoaded() {
  try {
    // First load models that other models depend on
    if (!mongoose.models.tournaments) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("@/models/tournamentsModel");
      console.log("✅ Tournaments model loaded");
    }
    
    if (!mongoose.models.teams) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("@/models/teamsModel");
      console.log("✅ Teams model loaded");
    }
    
    if (!mongoose.models.players) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("@/models/playersModel");
      console.log("✅ Players model loaded");
    }
    
    // Then load models that have dependencies
    if (!mongoose.models.matches) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("@/models/matchesModel");
      console.log("✅ Matches model loaded");
    }
    
    if (!mongoose.models.innings) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("@/models/inningsModel");
      console.log("✅ Innings model loaded");
    }
    
    if (!mongoose.models.overs) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("@/models/oversModel");
      console.log("✅ Overs model loaded");
    }
    
    // Now check if all required models are loaded
    const requiredModels = [
      "tournaments", "teams", "players", "matches", "innings", "overs"
    ];
    
    const missingModels = requiredModels.filter(model => !mongoose.models[model]);
    
    if (missingModels.length > 0) {
      console.warn(`⚠️ Some models are still missing: ${missingModels.join(", ")}`);
    } else {
      console.log("✅ All required models successfully loaded");
    }
    
  } catch (error) {
    console.error("❌ Error ensuring models are loaded:", error);
    throw error;
  }
}
