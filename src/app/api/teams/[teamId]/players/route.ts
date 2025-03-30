import { NextResponse } from "next/server";
import { connect } from "@/dbConfig/dbConfig";
import Player from "@/models/playerModel";

// Connect to database
await connect();

// GET - Fetch players from a specific team
export async function GET(
  request: Request,
  { params }: { params: { teamId: string } }
) {
  try {
    const teamId = params.teamId;
    
    // Find players for this team
    const players = await Player.find({ team: teamId })
      .select("playerName")
      .sort({ playerName: 1 });
    
    return NextResponse.json(players);
  } catch (error) {
    console.error("Error fetching team players:", error);
    return NextResponse.json(
      { error: "Failed to fetch team players" },
      { status: 500 }
    );
  }
}
