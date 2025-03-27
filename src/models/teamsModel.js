import mongoose from "mongoose";

const teamSchema = new mongoose.Schema({
    tournament_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "tournaments", // This should be consistent with the actual model name
        required: [true, "Tournament ID is required"],
    },
    team_id: {
        type: mongoose.Schema.Types.ObjectId,
        default: function () {
            return this._id;
        },
        unique: true,
    },
    teamName: {
        type: String,
        required: [true, "Team name is required"],
        trim: true,
    },
    logo: {
        type: String, // URL to the team logo
        default: null,
    },
    captain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "players", // Reference to the player who is captain
    },
    coach: {
        type: String,
        required: [true, "Coach name is required"],
    },
    players: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "players" // Reference to Player Model
    }],
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
    },
    homeGround: {
        type: String,
        default: null,
    },
    foundedYear: {
        type: Number,
        default: null,
    },
    description: {
        type: String,
        default: null,
    },
    // Additional fields for tournament-specific info
    shortCode: {
        type: String,
        trim: true,
        maxlength: [5, "Short code must be less than 5 characters"],
    },
    viceCaptain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "players", // Reference to vice-captain
        default: null,
    },
    wicketKeeper: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "players", // Reference to wicket keeper
        default: null,
    }
}, {
    timestamps: true
});

// Add a player to the team and create PlayerStats for a tournament
teamSchema.methods.addPlayer = async function(playerId) {
    try {
        // Get the tournament ID
        const tournamentId = this.tournament_id;
            
        if (!tournamentId) {
            return { success: false, message: "Team must be associated with a tournament" };
        }
        
        // Check if player is already in this team
        if (this.players.includes(playerId)) {
            return { success: false, message: "Player already in team" };
        }
        
        // Check if player is already in another team for this tournament
        const PlayerStats = mongoose.model('playerstats');
        const existingStats = await PlayerStats.findOne({
            player_id: playerId,
            tournament_id: tournamentId
        });
        
        if (existingStats) {
            // Find team name to provide better error message
            const Team = mongoose.model('teams');
            const existingTeam = await Team.findById(existingStats.team_id);
            const teamName = existingTeam ? existingTeam.teamName : 'another team';
            
            return { 
                success: false, 
                message: `Player already registered with ${teamName} in this tournament` 
            };
        }
        
        // Add player to the team
        this.players.push(playerId);
        await this.save();
        
        // Create player stats for this tournament
        await PlayerStats.create({
            player_id: playerId,
            tournament_id: tournamentId,
            team_id: this._id,
            battingStats: {
                matches: 0,
                runs: 0,
                strikeRate: 0,
                average: 0,
                fifties: 0,
                centuries: 0,
                ballsFaced: 0,
            },
            bowlingStats: {
                matches: 0,
                oversBowled: 0,
                wickets: 0,
                economyRate: 0,
                bowlingAverage: 0,
                bestFigures: "0/0",
            },
            fieldingStats: {
                catches: 0,
                stumpings: 0,
            }
        });
        
        return { success: true, message: "Player added to team successfully" };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

// Remove a player from the team
teamSchema.methods.removePlayer = async function(playerId) {
    try {
        // Get the tournament ID
        const tournamentId = this.tournament_id;
            
        if (!tournamentId) {
            return { success: false, message: "Team must be associated with a tournament" };
        }
        
        // Check if player exists in the team
        if (!this.players.includes(playerId)) {
            return { success: false, message: "Player not in team" };
        }
        
        // Check if player is captain, vice-captain, or wicket-keeper
        if (
            (this.captain && this.captain.equals(playerId)) ||
            (this.viceCaptain && this.viceCaptain.equals(playerId)) ||
            (this.wicketKeeper && this.wicketKeeper.equals(playerId))
        ) {
            return { success: false, message: "Cannot remove player with special role (captain/vice-captain/wicket-keeper)" };
        }
        
        // Remove player from players array
        this.players = this.players.filter(player => !player.equals(playerId));
        await this.save();
        
        // Remove player stats for this tournament
        const PlayerStats = mongoose.model('playerstats');
        await PlayerStats.deleteOne({
            player_id: playerId,
            tournament_id: tournamentId,
            team_id: this._id
        });
        
        return { success: true, message: "Player removed from team successfully" };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

// Static method to check if a player is already registered in a tournament
teamSchema.statics.isPlayerInTournament = async function(playerId, tournamentId) {
    try {
        const PlayerStats = mongoose.model('playerstats');
        const existingStats = await PlayerStats.findOne({
            player_id: playerId,
            tournament_id: tournamentId
        }).populate('team_id', 'teamName');
        
        if (existingStats) {
            return {
                isRegistered: true,
                team: existingStats.team_id,
                stats: existingStats
            };
        }
        
        return { isRegistered: false };
    } catch (error) {
        console.error("Error checking player tournament status:", error);
        throw error;
    }
};

// Assign a role to a player (captain, vice-captain, or wicket-keeper)
teamSchema.methods.assignRole = async function(playerId, role) {
    try {
        // Make sure the player is part of the team
        if (!this.players.includes(playerId)) {
            return { success: false, message: "Player must be added to the team first" };
        }
        
        // Update the appropriate role
        if (role === 'captain') {
            this.captain = playerId;
        } else if (role === 'viceCaptain') {
            this.viceCaptain = playerId;
        } else if (role === 'wicketKeeper') {
            this.wicketKeeper = playerId;
        } else {
            return { success: false, message: "Invalid role. Must be captain, viceCaptain, or wicketKeeper" };
        }
        
        await this.save();
        return { success: true, message: `Player assigned as ${role} successfully` };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

const Team = mongoose.models.teams || mongoose.model("teams", teamSchema);
export default Team;
