import mongoose from "mongoose";

const inningsSchema = new mongoose.Schema({
    innings_id: {
        type: mongoose.Schema.Types.ObjectId,
        default: function () {
            return this._id;
        },
        unique: true,
    },
    match_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "matches", // Reference to Match Model
        required: [true, "Match ID is required"],
    },
    innings_number: {
        type: Number,
        required: [true, "Innings number is required"],
        min: 1,
        max: 2,
        default: 1,
    },
    team: {
        batting_team:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "teams", // Reference to Team Model
            required: [true, "Batting Team ID is required"],
        },
        bowling_team:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "teams", // Reference to Team Model
            required: [true, "Bowling Team ID is required"],
        }
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
    status: {
        type: String,
        enum: ["ongoing", "completed"],
        default: "ongoing"
    },
    current_over: {
        type: Number,
        default: 0
    },
    current_ball: {
        type: Number,
        default: 0
    }
});

// ✅ Virtual field to calculate total score (Runs + Extras)
inningsSchema.virtual("totalScore").get(function () {
    return this.runs + this.extras.wides + this.extras.no_balls + this.extras.byes + this.extras.leg_byes;
});

const Innings = mongoose.models.innings || mongoose.model("innings", inningsSchema);
export default Innings;
