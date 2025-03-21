import mongoose from "mongoose";
import ballSchema from "./ballsModel";  

const overSchema = new mongoose.Schema({
    match_id: {
         type: mongoose.Schema.Types.ObjectId,
                ref: "matches", // Reference to Match Model
                required: [true, "Match ID is required"],
    },
    innings_id: {
       type: mongoose.Schema.Types.ObjectId,
         ref: "innings", // Reference to Innings Model
        required: [true, "Innings ID is required"],
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
