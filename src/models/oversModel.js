import mongoose from "mongoose";
import ballSchema from "./ballModel.js";

const overSchema = new mongoose.Schema({
    match_id: {
        type: String,
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
                const legalDeliveries = balls.filter(ball => ball.extras.wides === 0 && ball.extras.no_balls === 0).length;
                return legalDeliveries <= 6;
            },
            message: "An over cannot have more than 6 legal deliveries!",
        },
    },
});

const Over = mongoose.models.overs || mongoose.model("overs", overSchema);
export default Over;
