import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConfig/dbConfig";
import Match from "@/models/matchesModel";
import Innings from "@/models/inningsModel";
import mongoose from "mongoose";

// Connect to database
await connect();

// Create a new innings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matchId, inningsNumber, battingTeam, bowlingTeam } = body;

    // Validate the required fields
    if (!matchId || !battingTeam || !bowlingTeam) {
      return NextResponse.json(
        { error: "Match ID, batting team, and bowling team are required" },
        { status: 400 }
      );
    }

    // Find the match
    const match = await Match.findById(matchId);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Check if match is ongoing
    if (match.status !== "ongoing") {
      return NextResponse.json(
        { error: "Match must be ongoing to create an innings" },
        { status: 400 }
      );
    }

    // Start a transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Check if an innings with this number already exists for this match
      const existingInnings = await Innings.findOne({
        match_id: matchId,
        innings_number: inningsNumber
      });

      if (existingInnings) {
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json(
          { error: `Innings ${inningsNumber} already exists for this match` },
          { status: 400 }
        );
      }

      // Create new innings
      const newInnings = new Innings({
        match_id: matchId,
        innings_number: inningsNumber,
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
        current_ball: 0,
        batsmen: [], // Empty array for batsmen stats
        bowlers: [], // Empty array for bowler stats
        current_batsmen: {
          striker: null,
          non_striker: null
        },
        current_bowler: null
      });

      const savedInnings = await newInnings.save({ session });

      // Add innings to match
      match.innings.push(savedInnings._id);
      await match.save({ session });

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      // Return the populated innings
      const populatedInnings = await Innings.findById(savedInnings._id)
        .populate({
          path: "team.batting_team team.bowling_team",
          select: "teamName shortCode"
        });

      return NextResponse.json(populatedInnings);
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error("Error creating innings:", error);
    return NextResponse.json(
      { error: "Failed to create innings" },
      { status: 500 }
    );
  }
}

// Update innings details
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { inningsId, action } = body;

    if (!inningsId) {
      return NextResponse.json(
        { error: "Innings ID is required" },
        { status: 400 }
      );
    }

    // Find the innings
    const innings = await Innings.findById(inningsId);
    if (!innings) {
      return NextResponse.json({ error: "Innings not found" }, { status: 404 });
    }

    // Handle different actions
    if (action === "updateBatsmen") {
      const { striker, nonStriker } = body;

      if (!striker || !nonStriker) {
        return NextResponse.json(
          { error: "Both striker and non-striker IDs are required" },
          { status: 400 }
        );
      }

      // Set the current batsmen
      innings.current_batsmen = {
        striker,
        non_striker: nonStriker
      };

      // Check if these batsmen are already tracked in the batsmen array
      const strikerExists = innings.batsmen.some(b => 
        b.player_id.toString() === striker.toString()
      );
      
      const nonStrikerExists = innings.batsmen.some(b => 
        b.player_id.toString() === nonStriker.toString()
      );

      // Add batsmen to tracking array if they don't exist
      if (!strikerExists) {
        innings.batsmen.push({
          player_id: striker,
          runs: 0,
          balls_faced: 0,
          fours: 0,
          sixes: 0,
          out: false
        });
      }

      if (!nonStrikerExists) {
        innings.batsmen.push({
          player_id: nonStriker,
          runs: 0,
          balls_faced: 0,
          fours: 0,
          sixes: 0,
          out: false
        });
      }

      await innings.save();
      return NextResponse.json(innings);
    }
    else if (action === "updateBowler") {
      const { bowlerId } = body;

      if (!bowlerId) {
        return NextResponse.json(
          { error: "Bowler ID is required" },
          { status: 400 }
        );
      }

      // Set the current bowler
      innings.current_bowler = bowlerId;

      // Check if this bowler is already tracked
      const bowlerExists = innings.bowlers.some(b => 
        b.player_id.toString() === bowlerId.toString()
      );

      // Add bowler to tracking array if they don't exist
      if (!bowlerExists) {
        innings.bowlers.push({
          player_id: bowlerId,
          overs_bowled: 0,
          balls_bowled: 0,
          runs_conceded: 0,
          wickets: 0
        });
      }

      await innings.save();
      return NextResponse.json(innings);
    }
    else if (action === "switchBatsmen") {
      // Swap striker and non-striker
      const temp = innings.current_batsmen.striker;
      innings.current_batsmen.striker = innings.current_batsmen.non_striker;
      innings.current_batsmen.non_striker = temp;

      await innings.save();
      return NextResponse.json(innings);
    }
    else if (action === "endInnings") {
      // Mark innings as completed
      innings.status = "completed";
      await innings.save();

      // Get the match to see if this was the last innings
      const match = await Match.findById(innings.match_id);
      
      return NextResponse.json({
        message: "Innings completed",
        innings,
        isMatchComplete: match.innings.length >= 2 || (match.match_format === "Test" && match.innings.length >= 4)
      });
    }
    else {
      return NextResponse.json(
        { error: "Unsupported action" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error updating innings:", error);
    return NextResponse.json(
      { error: "Failed to update innings" },
      { status: 500 }
    );
  }
}
