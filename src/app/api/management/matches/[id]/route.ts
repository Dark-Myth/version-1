import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConfig/dbConfig";
import Match from "@/models/matchesModel";
import Innings from "@/models/inningsModel";
import Over from "@/models/oversModel";

const connectionPromise = connect();
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectionPromise;
    const matchId = params.id;

    if (!matchId) {
      return NextResponse.json(
        { error: "Match ID is required" },
        { status: 400 }
      );
    }

    // Fetch the match with populated team data
    const match = await Match.findById(matchId)
      .populate("team1", "teamName shortCode")
      .populate("team2", "teamName shortCode")
      .populate("tournament_id", "tournamentName")
      .lean();

    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    // If the match has innings, fetch and populate them
    if (match.innings && match.innings.length > 0) {
      const populatedInnings = await Innings.find({ 
        _id: { $in: match.innings } 
      })
        .populate("team.batting_team", "teamName shortCode")
        .populate("team.bowling_team", "teamName shortCode")
        .populate({
          path: "overs",
          model: Over,
          populate: {
            path: "balls.batsman balls.bowler balls.wicket.fielder",
            select: "playerName"
          }
        })
        .lean();

      // Replace the innings IDs with the populated innings data
      match.innings = populatedInnings;
    }

    return NextResponse.json(match);
  } catch (error) {
    console.error("Error fetching match details:", error);
    return NextResponse.json(
      { error: "Failed to fetch match details" },
      { status: 500 }
    );
  }
}
