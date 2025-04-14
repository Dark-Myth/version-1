import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConfig/dbConfig";
import Match from "@/models/matchesModel";
import mongoose from "mongoose";

// Connect to database
await connect();

export async function GET(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const {matchId} =await  params;

    // Special handling for "upcoming" route parameter
    if (matchId === "upcoming") {
      // Find upcoming matches (scheduled matches in the future)
      const upcomingMatches = await Match.find({
        status: "scheduled",
        date: { $gte: new Date() }
      })
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
      .limit(10)
      .sort({ date: 1, time: 1 });

      return NextResponse.json(upcomingMatches);
    }
    
    // Check if matchId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      return NextResponse.json(
        { error: "Invalid match ID format" },
        { status: 400 }
      );
    }

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
          }
        ]
      });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    return NextResponse.json(match);
  } catch (error) {
    console.error("Error fetching match:", error);
    return NextResponse.json(
      { error: "Failed to fetch match" },
      { status: 500 }
    );
  }
}
