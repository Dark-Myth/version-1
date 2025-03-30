import { NextResponse } from "next/server";
import { connect } from "@/dbConfig/dbConfig";
import Match from "@/models/matchesModel";
import Team from "@/models/teamsModel";
import Tournament from "@/models/tournamentsModel";
import { getServerSession } from "next-auth";

// Connect to database outside the request handler to share the connection
const connectionPromise = connect();

/**
 * GET handler for fetching matches
 * Supports filtering by tournament, status, and search query
 */
export async function GET(request: Request) {
  try {
    // Wait for the connection to be established
    await connectionPromise;
    
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get("tournamentId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    
    // Build the query object
    const query: any = {};
    
    if (tournamentId && tournamentId !== "all") {
      query.tournament_id = tournamentId;
    }
    
    if (status && status !== "all") {
      query.status = status;
    }
    
    // Fetch matches with query
    let matches = await Match.find(query)
      .populate({
        path: 'tournament_id',
        select: 'tournamentName'
      })
      .populate({
        path: 'team1',
        select: 'teamName logo shortCode'
      })
      .populate({
        path: 'team2',
        select: 'teamName logo shortCode'
      })
      .populate({
        path: 'handler',
        select: 'username name'
      })
      .populate({ 
        path: 'innings',
        populate: {
          path: 'batsman bowler',
          select: 'name'
        }
      })
      .populate({
        path: 'winningTeam',
        select: 'teamName shortCode'
      })
      .sort({ date: 1, time: 1 }) // Sort by date and time
      .lean();
    
    // Apply search filtering if provided
    if (search) {
      const searchLower = search.toLowerCase();
      matches = matches.filter((match) => {
        return (
          match.team1?.teamName?.toLowerCase().includes(searchLower) ||
          match.team2?.teamName?.toLowerCase().includes(searchLower) ||
          match.tournament_id?.tournamentName?.toLowerCase().includes(searchLower) ||
          match.venue?.toLowerCase().includes(searchLower)
        );
      });
    }
    
    return NextResponse.json(matches);
  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating new match
 */
export async function POST(request: Request) {
  try {
    await connectionPromise;
    
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const data = await request.json();
    
    // Validate required fields
    const requiredFields = ['tournament_id', 'team1', 'team2', 'venue', 'date', 'time', 'handler'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json({ 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      }, { status: 400 });
    }
    
    // Check if teams are different
    if (data.team1 === data.team2) {
      return NextResponse.json({ 
        error: "Team 1 and Team 2 cannot be the same" 
      }, { status: 400 });
    }
    
    // Validate that both teams belong to the selected tournament
    const team1 = await Team.findById(data.team1);
    const team2 = await Team.findById(data.team2);
    
    if (!team1 || !team2) {
      return NextResponse.json({ 
        error: "One or both teams not found" 
      }, { status: 404 });
    }
    
    if (team1.tournament_id.toString() !== data.tournament_id || 
        team2.tournament_id.toString() !== data.tournament_id) {
      return NextResponse.json({ 
        error: "Teams must belong to the selected tournament" 
      }, { status: 400 });
    }
    
    // Format the match data
    const matchData = {
      tournament_id: data.tournament_id,
      team1: data.team1,
      team2: data.team2,
      venue: data.venue,
      date: data.date,
      time: data.time,
      status: data.status || "scheduled",
      match_type: data.match_type || "cricket-club",
      match_format: data.match_format || "T20",
      overs: data.overs || 20,
      handler: data.handler,
      innings: []
    };
    
    // Create the match
    const newMatch = await Match.create(matchData);
    
    // Populate fields for response
    const populatedMatch = await Match.findById(newMatch._id)
      .populate({
        path: 'tournament_id',
        select: 'tournamentName'
      })
      .populate({
        path: 'team1',
        select: 'teamName logo'
      })
      .populate({
        path: 'team2',
        select: 'teamName logo'
      })
      .populate({
        path: 'handler',
        select: 'username name'
      });
    
    return NextResponse.json(populatedMatch);
  } catch (error) {
    console.error("Error creating match:", error);
    return NextResponse.json(
      { error: "Failed to create match", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}

/**
 * PUT handler for updating match
 */
export async function PUT(request: Request) {
  try {
    await connectionPromise;
    
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const data = await request.json();
    const { id } = data;
    
    if (!id) {
      return NextResponse.json({ error: "Match ID is required" }, { status: 400 });
    }
    
    // Find the match to update
    const match = await Match.findById(id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    
    // If this is a status update only (e.g., cancellation)
    if (data.status && !data.team1) {
      match.status = data.status;
      
      if (data.status === "cancelled" && data.cancellationReason) {
        match.cancellationReason = data.cancellationReason;
      }
      
      if (data.status === "completed" && data.winningTeam) {
        match.winningTeam = data.winningTeam;
      }
      
      await match.save();
      
      return NextResponse.json({ message: "Match status updated successfully", match });
    }
    
    // Regular update with all fields
    if (data.team1 && data.team2 && data.team1 === data.team2) {
      return NextResponse.json({ 
        error: "Team 1 and Team 2 cannot be the same" 
      }, { status: 400 });
    }
    
    // Update allowed fields
    const updatableFields = [
      'tournament_id', 'team1', 'team2', 'venue', 'date', 'time', 
      'status', 'match_type', 'match_format', 'overs', 'handler'
    ];
    
    updatableFields.forEach(field => {
      if (data[field] !== undefined) {
        match[field] = data[field];
      }
    });
    
    await match.save();
    
    // Populate fields for response
    const populatedMatch = await Match.findById(id)
      .populate({
        path: 'tournament_id',
        select: 'tournamentName'
      })
      .populate({
        path: 'team1',
        select: 'teamName logo'
      })
      .populate({
        path: 'team2',
        select: 'teamName logo'
      })
      .populate({
        path: 'handler',
        select: 'username name'
      });
    
    return NextResponse.json({ message: "Match updated successfully", match: populatedMatch });
  } catch (error) {
    console.error("Error updating match:", error);
    return NextResponse.json(
      { error: "Failed to update match", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for removing a match
 */
export async function DELETE(request: Request) {
  try {
    await connectionPromise;
    
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "Match ID is required" }, { status: 400 });
    }
    
    // Check if match exists
    const match = await Match.findById(id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    
    // Can only delete completed, cancelled or tied matches
    const allowedStatuses = ['completed', 'cancelled', 'tied'];
    if (!allowedStatuses.includes(match.status)) {
      return NextResponse.json({ 
        error: "Can only delete completed, cancelled or tied matches" 
      }, { status: 400 });
    }
    
    await Match.findByIdAndDelete(id);
    
    return NextResponse.json({ message: "Match deleted successfully" });
  } catch (error) {
    console.error("Error deleting match:", error);
    return NextResponse.json(
      { error: "Failed to delete match", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}