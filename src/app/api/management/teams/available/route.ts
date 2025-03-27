import { NextRequest, NextResponse } from 'next/server';
import { connect } from "@/dbConfig/dbConfig";
import Team from "@/models/teamsModel";
import Player from "@/models/playersModel";

const connectionPromise = connect();

export async function GET(request: NextRequest) {
  try {
    await connectionPromise;
    
    const searchParams = request.nextUrl.searchParams;
    const teamId = searchParams.get('teamId');
    
    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }
    
    // Get team information to find tournament
    const team = await Team.findById(teamId);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }
    
    // Get tournament ID
    const tournamentId = team.tournament_id;
    
    // Find all teams in this tournament
    const teamsInTournament = await Team.find({ tournament_id: tournamentId }).select('_id');
    const teamIds = teamsInTournament.map(t => t._id);
    
    // Find all players already in teams in this tournament
    const playerIdsInTournament = await TeamPlayer.find({
      team_id: { $in: teamIds }
    }).select('player_id');
    
    const existingPlayerIds = playerIdsInTournament.map(p => p.player_id);
    
    // Find all players not in any team in this tournament
    const availablePlayers = await Player.find({
      _id: { $nin: existingPlayerIds },
      status: 'active' // Only active players
    }).select('_id playerName role battingStyle bowlingStyle status');
    
    // Map to required format
    const formattedPlayers = availablePlayers.map(player => ({
      id: player._id.toString(),
      playerName: player.playerName,
      role: player.role,
      battingStyle: player.battingStyle,
      bowlingStyle: player.bowlingStyle,
      status: player.status
    }));
    
    return NextResponse.json(formattedPlayers);
  } catch (error: any) {
    console.error("Error fetching available players:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}