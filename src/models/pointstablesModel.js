import mongoose from "mongoose";

const pointstableSchema = new mongoose.Schema({
    tournament_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "tournaments",
        required: [true, "Tournament ID is required"],
    },
    team_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "teams",
        required: [true, "Team ID is required"],
    },
    matchesPlayed: {
        type: Number,
        default: 0,
    },
    matchesWon: {
        type: Number,
        default: 0,
    },
    matchesLost: {
        type: Number,
        default: 0,
    },
    matchesTied: {
        type: Number,
        default: 0,
    },
    matchesNoResult: {
        type: Number,
        default: 0,
    },
    points: {
        type: Number,
        default: 0,
    },
    netRunRate: {
        type: Number,
        default: 0,
    },
});
// ✅ Automatically Update `matchesPlayed` Before Saving
pointstableSchema.pre("save", function (next) {
    this.matchesPlayed = this.matchesWon + this.matchesLost + this.matchesTied + this.matchesNoResult;
    this.points = (this.matchesWon * 2) + this.matchesTied; // 2 points per win, 1 per tie
    next();
});


pointstableSchema.virtual("winPercentage").get(function () {
    return this.matchesPlayed > 0 ? (this.matchesWon / this.matchesPlayed) * 100 : 0;
});

const PointsTable = mongoose.models.pointstables || mongoose.model("pointstables", pointstableSchema);
export default PointsTable;
    