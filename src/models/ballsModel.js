import mongoose from "mongoose";
import ballSchema from "./ballModel.js";

const overSchema = new mongoose.Schema({
    match_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "matches", // Reference to Match Model
        required: [true, "Match ID is required"],
    },
    over_number: {
        type: Number,
        required: [true, "Over Number is required"],
    },
    bowler: {
        type: String,
        required: [true, "Bowler is required"],
    },
    balls: {
        type: [ballSchema],
        validate: {
            validator: function (balls) {
                // ✅ Only count legal deliveries toward the 6-ball limit
                const legalDeliveries = balls.filter(ball => !ball.extras.wides && !ball.extras.no_balls).length;
                return legalDeliveries <= 6;
            },
            message: "An over cannot have more than 6 legal deliveries!",
        },
    },
});

const Over = mongoose.models.overs || mongoose.model("overs", overSchema);
export default Over;
