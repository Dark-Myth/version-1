import { NextResponse } from "next/server";
import { connect } from "@/dbConfig/dbConfig";
import Team from "@/models/teamsModel";
import Tournament from "@/models/tournamentsModel";

// Connect to database outside the request handler to share the connection
const connectionPromise = connect();

/**
 * GET handler for fetching teams for a specific tournament
 */
export async function GET(request: Request) {
  try {
    // Wait for the connection to be established
    await connectionPromise;
    
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get("tournamentId");
    
    if (!tournamentId) {
      return NextResponse.json({ error: "Tournament ID is required" }, { status: 400 });
    }
    
    // Verify that the tournament exists
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }
    
    // Find all teams for this tournament
    const teams = await Team.find({ tournament_id: tournamentId })
      .select('teamName shortCode logo status captain')
      .populate({
        path: 'captain',
        select: 'name'
      })
      .lean();
    
    // Format response to include player count
    const formattedTeams = teams.map(team => ({
      ...team,
      playerCount: team.players ? team.players.length : 0,
      captainName: team.captain ? team.captain.name : null
    }));
    
    return NextResponse.json(formattedTeams);
  } catch (error) {
    console.error("Error fetching tournament teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch tournament teams", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}