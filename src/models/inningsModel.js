import mongoose from "mongoose";

const inningsSchema = new mongoose.Schema({
    match_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "matches", // Reference to Match Model
        required: [true, "Match ID is required"],
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "teams", // Reference to Team Model
        required: [true, "Team ID is required"],
    },
    runs: {
        type: Number,
        required: [true, "Runs are required"],
        default: 0,
    },
    wickets: {
        type: Number,
        required: [true, "Wickets are required"],
        min: 0,
        max: 10,
        default: 0,
    },
    overs: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "overs", // Reference to Over Model
        },
    ],
    extras: {
        wides: { type: Number, default: 0 },
        no_balls: { type: Number, default: 0 },
        byes: { type: Number, default: 0 },
        leg_byes: { type: Number, default: 0 },
    },
});

// ✅ Virtual field to calculate total score (Runs + Extras)
inningsSchema.virtual("totalScore").get(function () {
    return this.runs + this.extras.wides + this.extras.no_balls + this.extras.byes + this.extras.leg_byes;
});

const Innings = mongoose.models.innings || mongoose.model("innings", inningsSchema);
export default Innings;
