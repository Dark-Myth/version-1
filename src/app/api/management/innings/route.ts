import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConfig/dbConfig";
import Match from "@/models/matchesModel";
import Innings from "@/models/inningsModel";

const connectionPromise = connect();

export async function POST(req: NextRequest) {
  try {
    await connectionPromise;
    const { matchId, inningsNumber, battingTeam, bowlingTeam } = await req.json();

    if (!matchId || !battingTeam || !bowlingTeam) {
      return NextResponse.json(
        { error: "Match ID, batting team, and bowling team are required" },
        { status: 400 }
      );
    }

    // Find the match
    const match = await Match.findById(matchId);

    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    // Create new innings
    const newInnings = new Innings({
      match_id: matchId,
      innings_number: inningsNumber || 1,
      team: {
        batting_team: battingTeam,
        bowling_team: bowlingTeam
      },
      runs: 0,
      wickets: 0,
      overs: [],
      extras: {
        wides: 0,
        no_balls: 0,
        byes: 0,
        leg_byes: 0
      },
      status: "ongoing",
      current_over: 0,
      current_ball: 0
    });

    const savedInnings = await newInnings.save();
    
    // Add innings to match
    match.innings.push(savedInnings._id);
    await match.save();

    // Populate team details for response
    const populatedInnings = await Innings.findById(savedInnings._id)
      .populate("team.batting_team", "teamName shortCode")
      .populate("team.bowling_team", "teamName shortCode");

    return NextResponse.json(populatedInnings);
  } catch (error) {
    console.error("Error creating innings:", error);
    return NextResponse.json(
      { error: "Failed to create innings" },
      { status: 500 }
    );
  }
}
