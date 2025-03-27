// Route: /api/management/teams/players
// Methods: POST, DELETE
// Purpose: Add players to a team or remove them

import { NextRequest, NextResponse } from 'next/server';
import { connect } from "@/dbConfig/dbConfig";
import Team from "@/models/teamsModel";
import Player from "@/models/playersModel";
import PlayerStats from "@/models/playerStatsModel";
import mongoose from "mongoose";

const connectionPromise = connect();

// POST - Add players to a team
export async function POST(request: NextRequest) {
  try {
    await connectionPromise;
    
    console.log("Request received to add players to team");
    
    const body = await request.json();
    const { teamId, playerIds } = body;
    
    console.log("Request body:", { teamId, playerIds });
    
    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }
    
    if (!playerIds || !Array.isArray(playerIds) || playerIds.length === 0) {
      return NextResponse.json({ error: 'Player IDs are required' }, { status: 400 });
    }
    
    // Check if team exists
    const team = await Team.findById(teamId);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }
    
    console.log("Team found:", { id: team._id, name: team.teamName });
    
    // Check if all players exist
    const players = await Player.find({ _id: { $in: playerIds } });
    if (players.length !== playerIds.length) {
      const foundIds = players.map(p => p._id.toString());
      const missingIds = playerIds.filter(id => !foundIds.includes(id));
      console.log("Missing player IDs:", missingIds);
      return NextResponse.json({ 
        error: 'One or more players not found',
        missingPlayerIds: missingIds
      }, { status: 404 });
    }
    
    console.log("All players found, proceeding to add them");
    
    // Add players directly to the team's players array if they're not already there
    let addedPlayers = 0;
    const alreadyInTeam = [];
    const newlyAdded = [];
    
    for (const playerId of playerIds) {
      // Check if player is already in the team
      if (!team.players) {
        team.players = [];
      }
      
      const playerIdStr = playerId.toString();
      const isPlayerInTeam = team.players.some(p => p.toString() === playerIdStr);
      
      if (isPlayerInTeam) {
        alreadyInTeam.push(playerId);
        continue;
      }
      
      // Check if player is already in another team for this tournament
      try {
        const tournamentId = team.tournament_id;
        const otherTeamsWithPlayer = await Team.find({
          _id: { $ne: team._id },
          tournament_id: tournamentId,
          players: { $in: [new mongoose.Types.ObjectId(playerId)] }
        });
        
        if (otherTeamsWithPlayer.length > 0) {
          console.log(`Player ${playerId} already in another team for this tournament`);
          continue;
        }
        
        // Add player to the team
        team.players.push(playerId);
        newlyAdded.push(playerId);
        addedPlayers++;
        
        // Create player stats for this tournament if needed
        const existingStats = await PlayerStats.findOne({
          player_id: playerId,
          tournament_id: tournamentId,
          team_id: team._id
        });
        
        if (!existingStats) {
          await PlayerStats.create({
            player_id: playerId,
            tournament_id: tournamentId,
            team_id: team._id,
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
        }
      } catch (error) {
        console.error(`Error adding player ${playerId}:`, error);
      }
    }
    
    // Save the team with new players
    if (addedPlayers > 0) {
      await team.save();
      console.log(`Added ${addedPlayers} players to team ${team.teamName}`);
    }
    
    return NextResponse.json({
      success: true,
      message: `Added ${addedPlayers} players to the team`,
      addedCount: addedPlayers,
      alreadyInTeam: alreadyInTeam.length,
      newlyAdded: newlyAdded
    });
  } catch (error: any) {
    console.error("Error adding players to team:", error);
    return NextResponse.json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// DELETE - Remove a player from a team
export async function DELETE(request: NextRequest) {
  try {
    await connectionPromise;
    
    const body = await request.json();
    const { teamId, playerId } = body;
    
    if (!teamId || !playerId) {
      return NextResponse.json({ error: 'Team ID and Player ID are required' }, { status: 400 });
    }
    
    // Find the team
    const team = await Team.findById(teamId);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }
    
    // Check if player is in the team
    if (!team.players || !team.players.some(id => id.toString() === playerId)) {
      return NextResponse.json({ error: 'Player not found in this team' }, { status: 404 });
    }
    
    // Use the model's removePlayer method
    const result = await team.removePlayer(playerId);
    
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
    
    return NextResponse.json({ 
      message: 'Player removed from team successfully',
      result: result 
    });
  } catch (error: any) {
    console.error("Error removing player from team:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}