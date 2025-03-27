// Route: /api/management/teams/[id]
// Methods: GET
// Purpose: Get detailed information about a specific team

import { NextRequest, NextResponse } from 'next/server';
import { connect } from "@/dbConfig/dbConfig";
import Team from "@/models/teamsModel";
import Player from "@/models/playersModel";
import PlayerStats from "@/models/playerStatsModel";
import mongoose from "mongoose";

const connectionPromise = connect();

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    await connectionPromise;
    
    const params = context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    // Validate that the ID is in the correct format for MongoDB
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json({ error: 'Invalid team ID format' }, { status: 400 });
    }
    
    // Fetch team basic info
    const teamInfo = await Team.findById(id).lean();
    
    if (!teamInfo) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Get player IDs directly from team's players array
    const playerIds = teamInfo.players || [];
    
    // Fetch player details
    const players = await Player.find({ _id: { $in: playerIds } }).lean();
    
    // Map players with their roles in the team
    const mappedPlayers = players.map(player => {
      return {
        id: player._id.toString(),
        name: player.playerName,
        role: player.role,
        battingStyle: player.battingStyle,
        bowlingStyle: player.bowlingStyle,
        status: player.status,
        isCaptain: teamInfo.captain && teamInfo.captain.toString() === player._id.toString(),
        isViceCaptain: teamInfo.viceCaptain && teamInfo.viceCaptain.toString() === player._id.toString(),
        isWicketKeeper: teamInfo.wicketKeeper && teamInfo.wicketKeeper.toString() === player._id.toString(),
        stats: player.globalStats
      };
    });
    
    // Get tournament info
    let tournamentInfo = null;
    if (teamInfo.tournament_id) {
      const tournamentData = await mongoose.model('tournaments').findById(teamInfo.tournament_id).lean();
      if (tournamentData) {
        tournamentInfo = {
          id: tournamentData._id.toString(),
          name: tournamentData.tournamentName,
          status: tournamentData.status
        };
      }
    }
    
    // Prepare response
    const response = {
      id: teamInfo._id.toString(),
      teamName: teamInfo.teamName,
      shortCode: teamInfo.shortCode,
      logo: teamInfo.logo,
      coach: teamInfo.coach,
      status: teamInfo.status,
      createdAt: teamInfo.createdAt,
      updatedAt: teamInfo.updatedAt,
      tournament: tournamentInfo,
      players: mappedPlayers
    };
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error fetching team details:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}