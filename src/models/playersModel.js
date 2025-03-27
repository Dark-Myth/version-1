import mongoose from "mongoose";

const playerSchema = new mongoose.Schema({
  player_id: {
    type: mongoose.Schema.Types.ObjectId,
    default: function () {
      return this._id;
    },
    unique: true,
  },
  playerName: {
    type: String,
    required: [true, "Player Name is required"],
  },
  role: {
    type: String,
    enum: ["batsman", "bowler", "all-rounder", "wicket-keeper"],
    required: [true, "Role is required"],
  },
  battingStyle: {
    type: String,
    required: function () {
      return (
        this.role === "batsman" ||
        this.role === "all-rounder" ||
        this.role === "wicket-keeper"
      );
    },
  },
  bowlingStyle: {
    type: String,
    required: function () {
      return this.role === "bowler" || this.role === "all-rounder";
    },
    default: function () {
      // Set default for non-bowling roles
      return (this.role === "batsman" || this.role === "wicket-keeper") ? "N/A" : undefined;
    }
  },
  status: {
    type: String,
    enum: ["active", "injured", "retired"],
    required: [true, "Status is required"],
    default: "active"
  },

  // 🌍 GLOBAL CAREER STATS (Aggregated Across All Tournaments)
  globalStats: {
    batting: {
      matches: { type: Number, default: 0 },
      runs: { type: Number, default: 0 },
      strikeRate: { type: Number, default: 0 },
      average: { type: Number, default: 0 },
      fifties: { type: Number, default: 0 },
      centuries: { type: Number, default: 0 },
      ballsFaced: { type: Number, default: 0 },
    },
    bowling: {
      matches: { type: Number, default: 0 },
      oversBowled: { type: Number, default: 0 },
      wickets: { type: Number, default: 0 },
      economyRate: { type: Number, default: 0 },
      bowlingAverage: { type: Number, default: 0 },
      bestFigures: { type: String, default: "0/0" }, // Example: "5/30"
    },
    fielding: {
      catches: { type: Number, default: 0 },
      stumpings: { type: Number, default: 0 },
    },
  },
});

// ✅ Virtual field to calculate global career strike rate dynamically
playerSchema.virtual("careerStrikeRate").get(function () {
  return this.globalStats.batting.ballsFaced > 0
    ? (this.globalStats.batting.runs / this.globalStats.batting.ballsFaced) *
        100
    : 0;
});

const Player =
  mongoose.models.players || mongoose.model("players", playerSchema);
export default Player;
