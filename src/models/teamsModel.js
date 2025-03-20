import mongoose from "mongoose";

const teamSchema = new mongoose.Schema({
    team_id: {
                type: mongoose.Schema.Types.ObjectId,
                default: function () {
                    return this._id;
                },
                unique: true,
    },
    teamName: {
        type: String,
        required: [true, "Team Name is required"],
        unique: true,
    },
    tournament_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "tournaments", // Reference to Tournament Model
        required: [true, "Tournament ID is required"],
    },
    players: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "players", // Reference to Players
            required: [true, "At least one player is required"],
        },
    ],
    captain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "players", // Reference to Players
        required: [true, "Captain is required"],
    },
    viceCaptain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "players", // Reference to Players
        required: false, // Some teams may not have a vice-captain
    },
    wicketKeeper: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "players", // Reference to Players
        required: false,
    },
    coach: {
        type: String,
        required: false,
    },
    status: {
        type: String,
        enum: ["active", "inactive", "disbanded"],
        required: [true, "Status is required"],
    },
});

const Team = mongoose.models.teams || mongoose.model("teams", teamSchema);
export default Team;
