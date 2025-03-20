import mongoose from "mongoose";

const ballSchema = new mongoose.Schema({
    ball_number: {
        type: Number,
        required: [true, "Ball Number is required"],
    },
    batsman: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player',
        required: [true, "Batsman is required"],
    },
    bowler: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player',
        required: [true, "Bowler is required"],
    },
    runs: {
        type: Number,
        required: [true, "Runs are required"],
    },
    wicket: {
        fallen: {
            type: Boolean,
            required: true,
        },
        wicketType: {
            type: String,
            enum: ["bowled", "caught", "lbw", "run out", "stumped", "hit wicket"],
            required: function () {
                return this.fallen;
            },
        },
        fielder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Player',
            required: function () {
                return this.fallen && ["caught", "run out", "stumped"].includes(this.wicketType);
            },
        },
    },
    extras: {
        wides: { type: Number, default: 0 },
        no_balls: { type: Number, default: 0 },
        byes: { type: Number, default: 0 },
        leg_byes: { type: Number, default: 0 },
    },
});

export default ballSchema;
