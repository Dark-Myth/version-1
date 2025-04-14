import mongoose from "mongoose";

const ballSchema = new mongoose.Schema({
    ball_number: {
        type: Number,
        required: [true, "Ball Number is required"],
    },
    batsman: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'players',
        required: [true, "Batsman is required"],
    },
    bowler: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'players',
        required: [true, "Bowler is required"],
    },
    runs: {
        type: Number,
        required: [true, "Runs are required"],
    },
    isLegalDelivery: {
        type: Boolean,
        default: true
    },
    wicket: {
        fallen: {
            type: Boolean,
            required: true,
        },
        batsmanOut: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'players',
            required: function() {
                return this.wicket.fallen;
            }
        },
        wicketType: {
            type: String,
            enum: ["bowled", "caught", "lbw", "run out", "stumped", "hit wicket", ""],
            required: function () {
                return this.wicket.fallen;
            },
            default: "",
        },
        fielder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'players',
            required: function () {
                return this.wicket.fallen && ["caught", "run out", "stumped"].includes(this.wicketType);
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
