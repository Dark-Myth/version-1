// Route: /api/management/teams
// Methods: GET, POST, PUT, DELETE
// Purpose: CRUD operations for team management

import { NextRequest, NextResponse } from 'next/server';
import { connect } from "@/dbConfig/dbConfig";
import Team from "@/models/teamsModel";
import Tournament from "@/models/tournamentsModel";
import mongoose from "mongoose";

const connectionPromise = connect();

export async function GET(request: NextRequest) {
  try {
    await connectionPromise;
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const global = searchParams.get('global') === 'true';
    const tournamentId = searchParams.get('tournamentId');
    const id = searchParams.get('id');
    
    // If a specific team ID is requested
    if (id) {
      const team = await Team.findById(id)
        .populate({
          path: 'tournament_id',
          select: 'tournamentName status'
        });
        
      if (!team) {
        return NextResponse.json({ error: 'Team not found' }, { status: 404 });
      }
      
      const formattedTeam = {
        id: team._id,
        teamName: team.teamName,
        shortCode: team.shortCode,
        tournament: team.tournament_id ? {
          id: team.tournament_id._id,
          name: team.tournament_id.tournamentName,
          status: team.tournament_id.status
        } : null,
        coach: team.coach,
        playerCount: team.players ? team.players.length : 0,
        status: team.status
      };
      
      return NextResponse.json(formattedTeam);
    }
    
    // Build query for teams list
    const query: any = {};
    
    if (search) {
      query.$or = [
        { teamName: { $regex: search, $options: 'i' } },
        { shortCode: { $regex: search, $options: 'i' } },
        { coach: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (!global && tournamentId && tournamentId !== 'all') {
      query.tournament_id = new mongoose.Types.ObjectId(tournamentId);
    }
    
    console.log("Teams query:", query);
    
    // Get all teams with applied filters
    const teams = await Team.find(query)
      .populate({
        path: 'tournament_id',
        select: 'tournamentName'
      })
      .lean();
    
    // Format teams for response
    const formattedTeams = teams.map(team => ({
      id: team._id.toString(),
      teamName: team.teamName,
      shortCode: team.shortCode,
      tournament: team.tournament_id ? {
        id: team.tournament_id._id.toString(),
        name: team.tournament_id.tournamentName
      } : null,
      tournament_id: team.tournament_id?._id.toString(),
      coach: team.coach,
      players: team.players ? team.players.length : 0,
      playerCount: team.players ? team.players.length : 0,
      status: team.status
    }));
    
    return NextResponse.json(formattedTeams);
  } catch (error: any) {
    console.error("Error fetching teams:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectionPromise;
    const body = await request.json();
    
    const { teamName, shortCode, coach, status, tournament_id } = body;
    
    // Validate required fields
    if (!teamName || !teamName.trim()) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }
    
    if (!tournament_id) {
      return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 });
    }
    
    // Verify tournament exists
    const tournament = await Tournament.findById(tournament_id);
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }
    
    // Check if team with same name already exists in this tournament
    const existingTeam = await Team.findOne({
      teamName: teamName.trim(),
      tournament_id: tournament_id
    });
    
    if (existingTeam) {
      return NextResponse.json(
        { error: `Team "${teamName}" already exists in this tournament` },
        { status: 409 }
      );
    }
    
    // Create the team
    const team = new Team({
      teamName: teamName.trim(),
      shortCode: shortCode?.trim(),
      coach: coach?.trim() || "TBD",
      status: status || 'active',
      tournament_id: tournament_id,
      players: [] // Ensure players array is initialized
    });
    
    await team.save();
    
    // Return the created team
    const createdTeam = {
      id: team._id,
      teamName: team.teamName,
      shortCode: team.shortCode,
      tournament_id: tournament_id,
      tournament: {
        id: tournament._id,
        name: tournament.tournamentName
      },
      coach: team.coach,
      status: team.status,
      players: 0,
      playerCount: 0
    };
    
    return NextResponse.json(createdTeam, { status: 201 });
  } catch (error: any) {
    console.error("Error creating team:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectionPromise;
    
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }
    
    const body = await request.json();
    const { teamName, shortCode, coach, status } = body;
    
    if (!teamName || !teamName.trim()) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }
    
    // Check if team exists
    const team = await Team.findById(id);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }
    
    // Check for name conflicts
    const existingTeam = await Team.findOne({
      teamName: teamName.trim(),
      tournament_id: team.tournament_id,
      _id: { $ne: team._id }
    });
    
    if (existingTeam) {
      return NextResponse.json(
        { error: `Another team with name "${teamName}" already exists in this tournament` },
        { status: 409 }
      );
    }
    
    // Update team
    team.teamName = teamName.trim();
    team.shortCode = shortCode?.trim();
    team.coach = coach?.trim() || "TBD";
    team.status = status || 'active';
    
    await team.save();
    
    const updatedTeam = {
      id: team._id,
      teamName: team.teamName,
      shortCode: team.shortCode,
      coach: team.coach,
      status: team.status,
      playerCount: team.players.length
    };
    
    return NextResponse.json(updatedTeam);
  } catch (error: any) {
    console.error("Error updating team:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }
    
    const team = await Team.findByIdAndDelete(id);
    
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Team deleted successfully' });
  } catch (error: any) {
    console.error("Error deleting team:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}