// Route: /api/management/players/available
// Methods: GET
// Purpose: Get players not already assigned to teams in a tournament

import { NextRequest, NextResponse } from 'next/server';
import { connect } from "@/dbConfig/dbConfig";
import Team from "@/models/teamsModel";
import Player from "@/models/playersModel";
import mongoose from "mongoose";

const connectionPromise = connect();

export async function GET(request: NextRequest) {
  try {
    await connectionPromise;
    
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    
    console.log("Fetching available players for team:", teamId);
    
    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }
    
    // Get team information to find tournament
    const team = await Team.findById(teamId).lean();
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }
    
    console.log("Team found:", { name: team.teamName, tournamentId: team.tournament_id });
    
    // Get tournament ID
    const tournamentId = team.tournament_id;
    
    // Find all teams in this tournament
    const teamsInTournament = await Team.find({ 
      tournament_id: tournamentId 
    }).lean();
    
    console.log(`Found ${teamsInTournament.length} teams in tournament`);
    
    // Get all player IDs already assigned to teams in this tournament
    const assignedPlayerIds = [];
    
    teamsInTournament.forEach(t => {
      if (t.players && t.players.length > 0) {
        t.players.forEach(playerId => {
          assignedPlayerIds.push(playerId.toString());
        });
      }
    });
    
    console.log(`Found ${assignedPlayerIds.length} assigned players in tournament`);
    
    // Find available players (not assigned to any team in this tournament)
    const availablePlayers = await Player.find({
      _id: { $nin: assignedPlayerIds },
      status: { $ne: 'retired' } // Exclude retired players
    })
    .select('_id playerName role battingStyle bowlingStyle status')
    .lean();
    
    console.log(`Found ${availablePlayers.length} available players`);
    
    // Format the response
    const formattedPlayers = availablePlayers.map(player => ({
      id: player._id.toString(),
      playerName: player.playerName,
      role: player.role,
      battingStyle: player.battingStyle || 'N/A',
      bowlingStyle: player.bowlingStyle || 'N/A',
      status: player.status
    }));
    
    return NextResponse.json(formattedPlayers);
  } catch (error: any) {
    console.error("Error fetching available players:", error);
    return NextResponse.json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}