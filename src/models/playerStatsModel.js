import mongoose from "mongoose";
import Player from "./playersModel.js";

const playerStatsSchema = new mongoose.Schema({
    player_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "players", // Make sure this matches the actual model name
        required: [true, "Player ID is required"],
    },
    tournament_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "tournaments", // Make sure this matches the actual model name
        required: [true, "Tournament ID is required"],
    },
    team_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "teams", // Make sure this matches the actual model name
        required: [true, "Team ID is required"],
    },
    battingStats: {
        matches: { type: Number, default: 0 },
        runs: { type: Number, default: 0 },
        strikeRate: { type: Number, default: 0 },
        average: { type: Number, default: 0 },
        fifties: { type: Number, default: 0 },
        centuries: { type: Number, default: 0 },
        ballsFaced: { type: Number, default: 0 },
    },
    bowlingStats: {
        matches: { type: Number, default: 0 },
        oversBowled: { type: Number, default: 0 },
        wickets: { type: Number, default: 0 },
        economyRate: { type: Number, default: 0 },
        bowlingAverage: { type: Number, default: 0 },
        bestFigures: { type: String, default: "0/0" }, // Example: "5/30"
    },
    fieldingStats: {
        catches: { type: Number, default: 0 },
        stumpings: { type: Number, default: 0 },
    },
});

// ✅ Function to Update Global Stats After Tournament Ends
playerStatsSchema.statics.updateGlobalStats = async function (playerId) {
    const stats = await this.find({ player_id: playerId });

    let totalMatches = 0,
        totalRuns = 0,
        totalBallsFaced = 0,
        totalFifties = 0,
        totalCenturies = 0,
        totalWickets = 0,
        totalOversBowled = 0,
        totalCatches = 0,
        totalStumpings = 0;

    stats.forEach((stat) => {
        totalMatches += stat.battingStats.matches;
        totalRuns += stat.battingStats.runs;
        totalBallsFaced += stat.battingStats.ballsFaced;
        totalFifties += stat.battingStats.fifties;
        totalCenturies += stat.battingStats.centuries;
        totalWickets += stat.bowlingStats.wickets;
        totalOversBowled += stat.bowlingStats.oversBowled;
        totalCatches += stat.fieldingStats.catches;
        totalStumpings += stat.fieldingStats.stumpings;
    });

    await Player.findByIdAndUpdate(playerId, {
        globalStats: {
            batting: {
                matches: totalMatches,
                runs: totalRuns,
                strikeRate: totalBallsFaced ? (totalRuns / totalBallsFaced) * 100 : 0,
                average: totalMatches ? totalRuns / totalMatches : 0,
                fifties: totalFifties,
                centuries: totalCenturies,
                ballsFaced: totalBallsFaced,
            },
            bowling: {
                matches: totalMatches,
                wickets: totalWickets,
                oversBowled: totalOversBowled,
                economyRate: totalOversBowled ? totalRuns / totalOversBowled : 0,
            },
            fielding: {
                catches: totalCatches,
                stumpings: totalStumpings,
            },
        },
    });
};

const PlayerStats = mongoose.models.playerstats || mongoose.model("playerstats", playerStatsSchema);
export default PlayerStats;
