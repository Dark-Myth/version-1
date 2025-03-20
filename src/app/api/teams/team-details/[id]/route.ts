import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConfig/dbConfig";
import Team from "@/models/teamsModel";
import Player from "@/models/playersModel";
import PlayerStats from "@/models/playerStatsModel";

// Connect to database outside the request handler to share the connection
const connectionPromise = connect();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Wait for the connection to be established
    await connectionPromise;
    
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const tournament_id = searchParams.get('tournament_id');
    
    if (!id) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }
    
    // Build the query - add tournament_id filter if provided
    const query = tournament_id 
      ? { _id: id, tournament_id: tournament_id }
      : { _id: id };
    
    // Find the team and populate essential fields
    const team = await Team.findOne(query)
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
      team_id: id
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
        player_id: player._id,
        name: player.playerName,  // Use playerName field from player model
        role: displayRole,
        originalRole: player.role,
        battingStyle: player.battingStyle,
        bowlingStyle: player.bowlingStyle,
        status: player.status,
        isCapt,
        isViceCapt, 
        isWicketKeeper,
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
      const getRolePriority = (role) => {
        const roleLower = role.toLowerCase();
        if (roleLower.includes("all-rounder")) return 1;
        if (roleLower.includes("batsman")) return 2;
        if (roleLower.includes("bowler")) return 3;
        return 4;
      };
      
      return getRolePriority(a.originalRole) - getRolePriority(b.originalRole);
    });
    
    // Format team response with player info
    const teamWithPlayerInfo = {
      _id: team._id,
      teamName: team.teamName,
      shortCode: team.shortCode || null,
      status: team.status,
      coach: team.coach || null,
      tournament_id: team.tournament_id,
      players: team.players,
      playersInfo: sortedPlayers
    };
    
    return NextResponse.json(teamWithPlayerInfo);
  } catch (error) {
    console.error("Error fetching team details:", error);
    return NextResponse.json(
      { error: "Failed to fetch team details", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}
