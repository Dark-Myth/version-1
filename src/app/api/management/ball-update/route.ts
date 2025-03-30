import { NextResponse } from "next/server";
import { connect } from "@/dbConfig/dbConfig";
import Match from "@/models/matchesModel";
import Innings from "@/models/inningsModel";
import Overs from "@/models/oversModel";
import mongoose from "mongoose";

// Connect to database
await connect();

// POST - Record a ball in an innings
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      matchId, 
      inningsId, 
      batsmanId, 
      bowlerId, 
      runs, 
      isWicket, 
      wicketType, 
      fielderId,
      extras 
    } = body;

    // Validate required fields
    if (!matchId || !inningsId || !batsmanId || !bowlerId) {
      return NextResponse.json(
        { error: "Required fields missing" },
        { status: 400 }
      );
    }

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find the innings
      const innings = await Innings.findById(inningsId).session(session);
      
      if (!innings) {
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json(
          { error: "Innings not found" },
          { status: 404 }
        );
      }

      // Determine current over number and ball number
      let currentOverIndex = innings.current_over;
      let currentBallNumber = innings.current_ball + 1; // Increment for new ball
      
      // Check if we need a new over
      const isNewOver = currentBallNumber > 6 || innings.overs.length === 0;
      
      if (isNewOver) {
        currentOverIndex = innings.overs.length;
        currentBallNumber = 1; // Reset ball count for new over
      }

      // Create or retrieve the current over
      let currentOver;
      
      if (isNewOver) {
        // Create a new over
        currentOver = new Overs({
          match_id: matchId,
          innings_id: inningsId,
          over_number: currentOverIndex + 1, // Over numbers are 1-based
          bowler: bowlerId,
          balls: []
        });
      } else {
        // Get the current over
        currentOver = await Overs.findById(innings.overs[currentOverIndex]).session(session);
        
        if (!currentOver) {
          await session.abortTransaction();
          session.endSession();
          return NextResponse.json(
            { error: "Current over not found" },
            { status: 404 }
          );
        }
      }

      // Create the ball object
      const ball = {
        ball_number: currentBallNumber,
        batsman: batsmanId,
        bowler: bowlerId,
        runs: runs || 0,
        wicket: {
          fallen: isWicket || false,
          wicketType: wicketType || undefined,
          fielder: fielderId || undefined
        },
        extras: extras || {
          wides: 0,
          no_balls: 0,
          byes: 0,
          leg_byes: 0
        }
      };

      // Add the ball to the over
      currentOver.balls.push(ball);
      await currentOver.save({ session });

      // If it's a new over, add it to the innings
      if (isNewOver) {
        innings.overs.push(currentOver._id);
      }

      // Update innings stats
      innings.runs += runs || 0;
      
      // Add extras to innings totals
      if (extras) {
        innings.extras.wides += extras.wides || 0;
        innings.extras.no_balls += extras.no_balls || 0;
        innings.extras.byes += extras.byes || 0;
        innings.extras.leg_byes += extras.leg_byes || 0;
      }
      
      // Add wicket if applicable
      if (isWicket) {
        innings.wickets += 1;
      }

      // Update the current over and ball
      innings.current_over = currentOverIndex;
      innings.current_ball = currentBallNumber;
      
      // If this is the last ball of the over, prepare for next over
      if (currentBallNumber === 6 && !extras?.wides && !extras?.no_balls) {
        innings.current_over += 1;
        innings.current_ball = 0;
      }

      await innings.save({ session });

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      // Return the updated innings with populated data
      const updatedInnings = await Innings.findById(inningsId)
        .populate({
          path: "team.batting_team",
          select: "teamName shortCode"
        })
        .populate({
          path: "team.bowling_team",
          select: "teamName shortCode"
        })
        .populate({
          path: "overs",
          populate: {
            path: "balls.batsman balls.bowler balls.wicket.fielder",
            select: "playerName"
          }
        });

      return NextResponse.json(updatedInnings);
    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error("Error recording ball:", error);
    return NextResponse.json(
      { error: `Failed to record ball: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}
