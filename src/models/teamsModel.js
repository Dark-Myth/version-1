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
    shortCode: {
        type: String,
        required: [true, "Short code is required"],
        unique: true,
        maxlength: 3,
    },
    description: {
        type: String,
        required: false,
    },
    logo: {
        type: String,
        required: false,
    },
    captain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "players",
        required: false,
    },
    wicketKeeper: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "players",
        required: false,
    },
    viceCaptain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "players",
        required: false,
    },
    coach: {
        type: String,
        required: false,
    },
    tournament_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "tournaments",
        required: [true, "Tournament ID is required"],
    },
    players: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "players",
        },
    ],
    homeGround: {
        type: String,
        required: false,
    },
    established: {
        type: Date,
        required: false,
    },
    teamType: {
        type: String,
        enum: ["men", "women", "mixed"],
        default: "men",
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
    }
});

const Team = mongoose.models.teams || mongoose.model("teams", teamSchema);
export default Team;
