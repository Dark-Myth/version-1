import { NextResponse } from "next/server";
import { connect } from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import Tournament from "@/models/tournamentsModel";

// Connect to database outside the request handler to share the connection
const connectionPromise = connect();

/**
 * GET handler for fetching managers for a specific tournament
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
    
    // First, add the tournament handler to the list (usually the admin)
    const managerIds = [tournament.handler];
    
    // Add any additional managers
    if (tournament.userManagers && tournament.userManagers.length > 0) {
      managerIds.push(...tournament.userManagers);
    }
    
    // Find all users who are managers for this tournament
    const managers = await User.find({ 
      _id: { $in: managerIds } 
    })
    .select('username name email role')
    .lean();
    
    return NextResponse.json(managers);
  } catch (error) {
    console.error("Error fetching tournament managers:", error);
    return NextResponse.json(
      { error: "Failed to fetch tournament managers", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}