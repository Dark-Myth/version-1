import { NextResponse } from "next/server";
import { connect } from "@/dbConfig/dbConfig";
import Match from "@/models/matchesModel";
import Innings from "@/models/inningsModel";
import mongoose from "mongoose";

// Connect to database
await connect();

// GET - Fetch matches assigned to a specific handler
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const handlerId = searchParams.get("handler");
    
    if (!handlerId) {
      return NextResponse.json(
        { error: "Handler ID is required" },
        { status: 400 }
      );
    }

    // Fetch ongoing and scheduled matches for the handler
    const matches = await Match.find({ 
      handler: handlerId,
      status: { $in: ["scheduled", "ongoing"] }
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
    .populate({
      path: "innings"
    })
    .sort({ date: 1, time: 1 });

    return NextResponse.json(matches);
  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 }
    );
  }
}

// PUT - Start a match or update match status
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { matchId, action, inningsData } = body;

    if (!matchId) {
      return NextResponse.json(
        { error: "Match ID is required" },
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

    // Handle different actions
    if (action === "startMatch") {
      // Check if match is already started
      if (match.status === "ongoing") {
        return NextResponse.json(
          { error: "Match is already in progress" },
          { status: 400 }
        );
      }

      // Validate innings data
      if (!inningsData || !inningsData.battingTeam || !inningsData.bowlingTeam) {
        return NextResponse.json(
          { error: "Batting and bowling teams must be specified" },
          { status: 400 }
        );
      }

      // Start a session for transaction
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Update match status to ongoing
        match.status = "ongoing";
        await match.save({ session });

        // Create a new innings
        const newInnings = new Innings({
          match_id: matchId,
          innings_number: 1, // First innings
          team: {
            batting_team: inningsData.battingTeam,
            bowling_team: inningsData.bowlingTeam
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
          status: "ongoing"
        });

        const savedInnings = await newInnings.save({ session });

        // Add innings to match
        match.innings.push(savedInnings._id);
        await match.save({ session });

        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        // Return updated match with populated data
        const updatedMatch = await Match.findById(matchId)
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

        return NextResponse.json(updatedMatch);
      } catch (error) {
        // Abort transaction on error
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    } 
    // Handle other actions like endInnings, endMatch, etc.
    else {
      return NextResponse.json(
        { error: "Unsupported action" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error updating match:", error);
    return NextResponse.json(
      { error: "Failed to update match" },
      { status: 500 }
    );
  }
}
