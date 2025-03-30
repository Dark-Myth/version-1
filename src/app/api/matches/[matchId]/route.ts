import { NextResponse } from "next/server";
import { connect } from "@/dbConfig/dbConfig";
import Match from "@/models/matchesModel";

// Connect to database
await connect();

// GET - Fetch a specific match with all details
export async function GET(
  request: Request,
  { params }: { params: { matchId: string } }
) {
  try {
    const matchId = params.matchId;
    
    // Find the match with populated fields
    const match = await Match.findById(matchId)
      .populate({
        path: "tournament_id",
        select: "tournamentName"
      })
      .populate({
        path: "team1",
        select: "teamName shortCode"
      })
      .populate({
        path: "team2",
        select: "teamName shortCode"
      })
      .populate({
        path: "innings",
        populate: [
          {
            path: "team.batting_team",
            select: "teamName shortCode"
          },
          {
            path: "team.bowling_team",
            select: "teamName shortCode"
          },
          {
            path: "overs",
            populate: {
              path: "balls.batsman balls.bowler balls.wicket.fielder",
              select: "playerName"
            }
          }
        ]
      });
    
    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(match);
  } catch (error) {
    console.error("Error fetching match:", error);
    return NextResponse.json(
      { error: "Failed to fetch match details" },
      { status: 500 }
    );
  }
}
