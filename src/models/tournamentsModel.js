import mongoose from "mongoose";

const tournamentSchema = new mongoose.Schema({
    tournament_id: {
        type: mongoose.Schema.Types.ObjectId,
        default: function () {
            return this._id;
        },
        unique: true,
    },
    tournamentName: {
        type: String,
        required: [true, "Tournament Name is required"],
        unique: true,
    },
    hostedBy: {
        type: String,
        required: [true, "Hosted by is required"],
    },
    venue: {
        type: String,
        required: [true, "Venue is required"],
    },
    description: {
        type: String,
        required: [true, "Description is required"],
    },
    rules: {
        type: [String],
        required: [true, "Rules are required"],
    },
    prize: {
        type: [String],
        required: [true, "Prize is required"],
    },
    entryFee: {
        type: Number,
        required: [true, "Entry Fee is required"],
        min: 0, // Ensures the entry fee cannot be negative
    },
    startDate: {
        type: Date,
        required: [true, "Start Date is required"],
    },
    endDate: {
        type: Date,
        required: [true, "End Date is required"],
    },
    status: {
        type: String,
        enum: ["scheduled", "ongoing", "completed", "canceled"],
        required: [true, "Status is required"],
    },
    handler: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users", // Reference to User Model
        required: [true, "Handler is required"],
    },
    userManagers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users", // Reference to User Model
            required: [true, "User Managers are required"],
        },
    ],
    format: {
        type: String,
        enum: ["T20", "ODI", "Test"],
        required: [true, "Format is required"],
    },
    matches: {
        type: Number,
        default: 0,
    },
    teams: {
        type: Number,
        required: [true, "Number of teams is required"],
        min: 2,
    },
});

const Tournament = mongoose.models.tournaments || mongoose.model("tournaments", tournamentSchema);
export default Tournament;
