import { NextResponse } from "next/server";
import { connect } from "@/dbConfig/dbConfig";
import Team from "@/models/teamsModel";
import Player from "@/models/playersModel";
import PlayerStats from "@/models/playerStatsModel";

// Connect to database outside the request handler to share the connection
const connectionPromise = connect();

export async function GET(request: Request, { params }: { params: { id: string } }) {
    console.log("started");
  try {
    // Wait for the connection to be established
    await connectionPromise;
    
    const teamId = params.id;
    
    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }
    
    // Find the team and populate essential fields
    const team = await Team.findById(teamId)
      .populate({
        path: 'tournament_id',
        select: 'tournamentName startDate endDate venue'
      })
      .populate({
        path: 'captain',
        select: 'playerName role battingStyle bowlingStyle status globalStats'
      })
      .populate({
        path: 'viceCaptain',
        select: 'playerName role battingStyle bowlingStyle status globalStats'
      })
      .populate({
        path: 'wicketKeeper',
        select: 'playerName role battingStyle bowlingStyle status globalStats'
      })
      .lean();
    
    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }
    
    // Get all players from the team
    const players = await Player.find({ 
      _id: { $in: team.players } 
    }).lean();
    
    // Get tournament-specific stats for all players in this team
    const tournamentStats = await PlayerStats.find({
      player_id: { $in: team.players },
      tournament_id: team.tournament_id._id,
      team_id: teamId
    }).lean();
    
    // Create a map for quick lookups of tournament stats
    const statsMap = new Map();
    tournamentStats.forEach(stat => {
      statsMap.set(stat.player_id.toString(), stat);
    });
    
    // Process players with their stats
    const playersWithStats = players.map(player => {
      // Check for captain, vice-captain, and wicket-keeper roles
      const isCapt = team.captain && team.captain._id.toString() === player._id.toString();
      const isViceCapt = team.viceCaptain && team.viceCaptain._id.toString() === player._id.toString();
      const isWicketKeeper = team.wicketKeeper && team.wicketKeeper._id.toString() === player._id.toString();
      
      // Determine display role
      let displayRole = player.role || "";
      if (isCapt) displayRole = "Captain" + (displayRole ? ` (${displayRole})` : "");
      if (isViceCapt) displayRole = "Vice Captain" + (displayRole ? ` (${displayRole})` : "");
      if (isWicketKeeper && !displayRole.toLowerCase().includes("wicket-keeper")) {
        displayRole = "Wicket Keeper" + (displayRole ? ` (${displayRole})` : "");
      }
      
      // Get tournament-specific stats for this player
      const tournamentStatsForPlayer = statsMap.get(player._id.toString());
      
      // Return player with both global and tournament stats
      return {
        _id: player._id,
        playerName: player.playerName,
        role: player.role,
        displayRole: displayRole,
        battingStyle: player.battingStyle,
        bowlingStyle: player.bowlingStyle,
        status: player.status,
        isCapt,
        isViceCapt, 
        isWicketKeeper,
        stats: {
          // Global career stats from player model
          globalStats: player.globalStats || {
            batting: {
              matches: 0,
              runs: 0,
              strikeRate: 0,
              average: 0,
              fifties: 0,
              centuries: 0,
              ballsFaced: 0
            },
            bowling: {
              matches: 0,
              oversBowled: 0,
              wickets: 0,
              economyRate: 0,
              bowlingAverage: 0,
              bestFigures: "0/0"
            },
            fielding: {
              catches: 0,
              stumpings: 0
            }
          },
          // Tournament-specific stats
          tournamentStats: tournamentStatsForPlayer ? {
            batting: tournamentStatsForPlayer.battingStats,
            bowling: tournamentStatsForPlayer.bowlingStats,
            fielding: tournamentStatsForPlayer.fieldingStats
          } : {
            batting: {
              matches: 0,
              runs: 0,
              strikeRate: 0,
              average: 0,
              fifties: 0,
              centuries: 0,
              ballsFaced: 0
            },
            bowling: {
              matches: 0,
              oversBowled: 0,
              wickets: 0,
              economyRate: 0,
              bowlingAverage: 0,
              bestFigures: "0/0"
            },
            fielding: {
              catches: 0,
              stumpings: 0
            }
          }
        }
      };
    });
    
    // Sort players: Captain first, then Vice Captain, then wicket-keepers, then by role
    const sortedPlayers = playersWithStats.sort((a, b) => {
      if (a.isCapt) return -1;
      if (b.isCapt) return 1;
      if (a.isViceCapt) return -1;
      if (b.isViceCapt) return 1;
      if (a.isWicketKeeper) return -1;
      if (b.isWicketKeeper) return 1;
      
      // Then sort by role priority: all-rounder, batsman, bowler
      const getRolePriority = (role: string) => {
        if (role.includes("all-rounder")) return 1;
        if (role.includes("batsman")) return 2;
        if (role.includes("bowler")) return 3;
        return 4;
      };
      
      return getRolePriority(a.role) - getRolePriority(b.role);
    });
    
    // Format team response with player info
    const teamWithPlayerInfo = {
      _id: team._id,
      teamName: team.teamName,
      tournament: {
        _id: team.tournament_id._id,
        tournamentName: team.tournament_id.tournamentName,
        startDate: team.tournament_id.startDate,
        endDate: team.tournament_id.endDate,
        venue: team.tournament_id.venue
      },
      status: team.status,
      coach: team.coach,
      players: sortedPlayers
    };
    console.log("Team with player info:", teamWithPlayerInfo);
    return NextResponse.json(teamWithPlayerInfo);
  } catch (error) {
    console.error("Error fetching team details:", error);
    return NextResponse.json(
      { error: "Failed to fetch team details", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}