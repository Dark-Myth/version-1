import { NextResponse } from "next/server";
import { connect } from "@/dbConfig/dbConfig";
import mongoose from "mongoose";

// Connect to database
await connect();

// Explicitly load required models in correct order
const loadModels = () => {
  try {
    // Force import of models in the correct order
    const Tournament = require("@/models/tournamentsModel").default;
    const Team = require("@/models/teamsModel").default;
    const Match = require("@/models/matchesModel").default;
    const Innings = require("@/models/inningsModel").default;
    
    return {
      Tournament,
      Team,
      Match,
      Innings
    };
  } catch (error) {
    console.error("Error loading models:", error);
    throw error;
  }
};

// Load all models
const { Match, Innings } = loadModels();

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
          status: "ongoing",
          current_over: 0,
          current_ball: 0
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
    else if (action === "endInnings") {
      if (!inningsData || !inningsData.inningsId) {
        return NextResponse.json(
          { error: "Innings ID is required" },
          { status: 400 }
        );
      }

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Find the innings
        const innings = await Innings.findById(inningsData.inningsId);
        if (!innings) {
          await session.abortTransaction();
          session.endSession();
          return NextResponse.json({ error: "Innings not found" }, { status: 404 });
        }

        // Update innings status
        innings.status = "completed";
        await innings.save({ session });

        // If this was the first innings, we might want to start the second innings
        if (innings.innings_number === 1 && match.match_format !== "Test") {
          // For limited overs cricket, we swap teams for second innings
          const newInnings = new Innings({
            match_id: matchId,
            innings_number: 2,
            team: {
              batting_team: innings.team.bowling_team, // Teams swap roles
              bowling_team: innings.team.batting_team
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

          const savedSecondInnings = await newInnings.save({ session });
          match.innings.push(savedSecondInnings._id);
          await match.save({ session });
        }

        // Commit transaction
        await session.commitTransaction();
        session.endSession();

        // Return updated match
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
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    }
    else if (action === "endMatch") {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Update match status
        match.status = "completed";
        
        // Determine the winner based on innings data
        if (inningsData && inningsData.winningTeam) {
          match.winningTeam = inningsData.winningTeam;
        }
        else if (inningsData && inningsData.isTied) {
          match.status = "tied";
          match.isTied = true;
        }
        
        await match.save({ session });
        
        // Update any ongoing innings to completed
        const ongoingInningsIds = match.innings.filter(async (inningsId) => {
          const inningsDoc = await Innings.findById(inningsId);
          return inningsDoc && inningsDoc.status === "ongoing";
        });
        
        if (ongoingInningsIds.length > 0) {
          await Innings.updateMany(
            { _id: { $in: ongoingInningsIds } },
            { $set: { status: "completed" } },
            { session }
          );
        }
        
        // Commit transaction
        await session.commitTransaction();
        session.endSession();
        
        return NextResponse.json({ message: "Match completed successfully", match });
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    } 
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
