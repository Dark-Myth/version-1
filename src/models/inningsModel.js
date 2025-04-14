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
    },
    batsmen: [
        {
            player_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "players"
            },
            runs: { type: Number, default: 0 },
            balls_faced: { type: Number, default: 0 },
            fours: { type: Number, default: 0 },
            sixes: { type: Number, default: 0 },
            out: { type: Boolean, default: false },
            hasPlayed: { type: Boolean, default: false },
            battingPosition: { type: Number },
            dismissal_type: {
                type: String,
                enum: ["bowled", "caught", "lbw", "run out", "stumped", "hit wicket", "retired", "not out", ""],
                default: "not out"
            },
            dismissed_by: {
                bowler: { type: mongoose.Schema.Types.ObjectId, ref: "players", default: null },
                fielder: { type: mongoose.Schema.Types.ObjectId, ref: "players", default: null }
            },
            isCompleted: { 
                type: Boolean, 
                default: false, 
                // A batsman's innings is completed if they're out or declared
            }
        }
    ],
    bowlers: [
        {
            player_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "players"
            },
            overs_bowled: { type: Number, default: 0 },
            balls_bowled: { type: Number, default: 0 },
            maidens: { type: Number, default: 0 },
            runs_conceded: { type: Number, default: 0 },
            wickets: { type: Number, default: 0 },
            economy: { type: Number, default: 0 },
            no_balls: { type: Number, default: 0 },
            wides: { type: Number, default: 0 }
        }
    ],
    // Add explicit types for current_batsmen and current_bowler
    current_batsmen: {
        striker: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "players", 
            default: null 
        },
        non_striker: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "players", 
            default: null 
        }
    },
    current_bowler: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "players",
        default: null
    }
});

// Add a method to get available batsmen
inningsSchema.methods.getAvailableBatsmen = async function() {
    // Get all players from batting team
    const allTeamBatsmen = await mongoose.model('players').find({ team_id: this.team.batting_team });
    
    // Filter out batsmen who are already dismissed
    const dismissedIds = new Set(
        this.batsmen
            .filter(b => b.out)
            .map(b => b.player_id.toString())
    );
    
    return allTeamBatsmen.filter(player => !dismissedIds.has(player._id.toString()));
};

// Add a method to get completed batsmen
inningsSchema.methods.getCompletedBatsmen = function() {
    return this.batsmen.filter(batsman => 
        batsman.hasPlayed && 
        (batsman.out || batsman.isCompleted) && 
        (!this.current_batsmen.striker || !batsman.player_id.equals(this.current_batsmen.striker)) && 
        (!this.current_batsmen.non_striker || !batsman.player_id.equals(this.current_batsmen.non_striker))
    );
};

// Enhanced method to get current batsmen with more details
inningsSchema.methods.getCurrentBatsmen = function() {
    const striker = this.batsmen.find(b => 
        b.player_id && this.current_batsmen.striker && 
        b.player_id.equals(this.current_batsmen.striker)
    );
    
    const nonStriker = this.batsmen.find(b => 
        b.player_id && this.current_batsmen.non_striker &&
        b.player_id.equals(this.current_batsmen.non_striker)
    );
    
    return {
        striker: striker || null,
        nonStriker: nonStriker || null,
        strikerDetails: striker || {},
        nonStrikerDetails: nonStriker || {},
        allActiveBatsmen: this.batsmen.filter(b => 
            (b.player_id && this.current_batsmen.striker && b.player_id.equals(this.current_batsmen.striker)) || 
            (b.player_id && this.current_batsmen.non_striker && b.player_id.equals(this.current_batsmen.non_striker))
        )
    };
};

// Add method to get current bowler details
inningsSchema.methods.getCurrentBowlerDetails = function() {
    if (!this.current_bowler) return null;
    
    return this.bowlers.find(b => 
        b.player_id && this.current_bowler && 
        b.player_id.equals(this.current_bowler)
    ) || null;
};

// ✅ Virtual field to calculate total score (Runs + Extras)
inningsSchema.virtual("totalScore").get(function () {
    return this.runs + this.extras.wides + this.extras.no_balls + this.extras.byes + this.extras.leg_byes;
});

// Add virtual field for batting scorecard
inningsSchema.virtual("battingScorecard").get(function() {
    return this.batsmen.map(batsman => ({
        player_id: batsman.player_id,
        runs: batsman.runs,
        balls_faced: batsman.balls_faced,
        fours: batsman.fours,
        sixes: batsman.sixes,
        strike_rate: batsman.balls_faced > 0 ? ((batsman.runs / batsman.balls_faced) * 100).toFixed(2) : 0,
        dismissal_type: batsman.dismissal_type,
        dismissed_by: batsman.dismissed_by,
        isActive: (this.current_batsmen.striker && batsman.player_id.equals(this.current_batsmen.striker)) ||
                 (this.current_batsmen.non_striker && batsman.player_id.equals(this.current_batsmen.non_striker)),
        battingPosition: batsman.battingPosition,
        hasPlayed: batsman.hasPlayed,
        isOut: batsman.out
    }));
});

const Innings = mongoose.models.innings || mongoose.model("innings", inningsSchema);
export default Innings;
