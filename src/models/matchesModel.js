import mongoose from "mongoose";

const matchSchema = new mongoose.Schema({
    match_id: {
        type: mongoose.Schema.Types.ObjectId,
        default: function () {
            return this._id;
        },
        unique: true,
    },
    tournament_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "tournaments", // Reference to Tournament Model
        required: [true, "Tournament ID is required"],
    },
    team1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "teams", // Reference to Team Model
        required: [true, "Team 1 is required"],
    },
    team2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "teams", // Reference to Team Model
        required: [true, "Team 2 is required"],
    },
    date: {
        type: Date,
        required: [true, "Date is required"],
    },
    time: {
        type: String,
        required: [true, "Time is required"],
    },
    venue: {
        type: String,
        required: [true, "Location is required"],
    },
    innings: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "innings", // Reference to Innings Model
        },
    ],
    status: {
        type: String,
        enum: ["scheduled", "ongoing", "completed", "cancelled", "tied"],
        required: [true, "Status is required"],
    },
    superover: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "matches", // Reference to another match if superover occurs
        required: false,
    },
    winningTeam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "teams", // Reference to the actual winning team
        required: function () {
            return this.status === "completed" && this.status !== "tied";
        },
    },
    isTied: {
        type: Boolean,
        default: false,
    },
    handler: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users", // Reference to the user managing the match
        required: [true, "Handler is required"],
    },
    match_type: {
        type: String,
        enum: ["inter-house", "inter-college", "cricket-club"],
        required: [true, "Match type is required"],
    },
    match_format: {
        type: String,
        enum: ["T10", "T20", "ODI", "Test"],
        required: [true, "Match format is required"],
    },
    overs: {
        type: Number,
        required: function () {
            return this.match_format !== "Test"; // Overs required only for limited-overs formats
        },
        enum: [10, 15, 20, 30, 50],
    },
    comments: {
        type: String,
        required: false,
    },
    // Auto scheduling related fields
    isAutoScheduled: {
        type: Boolean,
        default: false,
    },
    scheduleDayOfWeek: {
        type: Number, // 0-6 (Sunday-Saturday)
        required: function() {
            return this.isAutoScheduled;
        },
    },
    recurringUntil: {
        type: Date,
        required: function() {
            return this.isAutoScheduled;
        },
    },
    cancellationReason: {
        type: String,
        required: function() {
            return this.status === "cancelled";
        },
    },
    umpires: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
    }],
    referee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
    }
});

const Match = mongoose.models.matches || mongoose.model("matches", matchSchema);
export default Match;