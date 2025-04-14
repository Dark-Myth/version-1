import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConfig/dbConfig";
import mongoose from "mongoose";
import { ensureModelsLoaded } from "@/utils/modelLoader";

// Connect to database
await connect();

// Ensure all models are loaded in the proper order
ensureModelsLoaded();

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Extract team ID from params
    const {id} = await params;
    const teamId = id;
    
    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }
    
    console.log(`Fetching team players for team ID: ${teamId}`);

    // Get model references dynamically to avoid import issues
    const Team = mongoose.model('teams');
    const Player = mongoose.model('players');

    // Find the team with populated player data
    const team = await Team.findById(teamId)
      .populate('players')
      .lean();

    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    console.log(`Found team: ${team.teamName} with ${team.players?.length || 0} players`);

    // Return just the players array
    return NextResponse.json(team.players || []);
  } catch (error: any) {
    console.error("Error fetching team players:", error);
    return NextResponse.json(
      { error: `Failed to fetch team players: ${error.message}` },
      { status: 500 }
    );
  }
}
