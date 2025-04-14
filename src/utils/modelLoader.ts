import mongoose from 'mongoose';

interface ModelsRegistry {
  [key: string]: boolean;
}

// Track which models have been registered
const registeredModels: ModelsRegistry = {};

/**
 * Ensures that all models are registered in the correct order
 * to avoid reference issues between related models
 */
export function ensureModelsLoaded() {
  try {
    // Base models with no dependencies
    if (!registeredModels.teams && !mongoose.models.teams) {
      require('@/models/teamsModel');
      registeredModels.teams = true;
      console.log('✅ Teams model loaded');
    }

    if (!registeredModels.tournaments && !mongoose.models.tournaments) {
      require('@/models/tournamentsModel');
      registeredModels.tournaments = true;
      console.log('✅ Tournaments model loaded');
    }

    if (!registeredModels.players && !mongoose.models.players) {
      require('@/models/playersModel');
      registeredModels.players = true;
      console.log('✅ Players model loaded');
    }

    // Models with dependencies on base models
    if (!registeredModels.matches && !mongoose.models.matches) {
      require('@/models/matchesModel');
      registeredModels.matches = true;
      console.log('✅ Matches model loaded');
    }

    if (!registeredModels.innings && !mongoose.models.innings) {
      require('@/models/inningsModel');
      registeredModels.innings = true;
      console.log('✅ Innings model loaded');
    }

    if (!registeredModels.overs && !mongoose.models.overs) {
      require('@/models/oversModel');
      registeredModels.overs = true;
      console.log('✅ Overs model loaded');
    }

    if (!registeredModels.playerstats && !mongoose.models.playerstats) {
      require('@/models/playerstatsModel');
      registeredModels.playerstats = true;
      console.log('✅ Player Stats model loaded');
    }

    // Return the loaded models
    return mongoose.models;
  } catch (error) {
    console.error('❌ Error loading models:', error);
    throw error;
  }
}

/**
 * Gets a model safely, ensuring it's loaded first
 * @param modelName The name of the model to get
 * @returns The mongoose model
 */
export function getModel(modelName: string) {
  ensureModelsLoaded();
  return mongoose.models[modelName];
}

/**
 * Checks which models are currently registered in mongoose
 * @returns Array of registered model names
 */
export function listRegisteredModels(): string[] {
  return Object.keys(mongoose.models);
}
