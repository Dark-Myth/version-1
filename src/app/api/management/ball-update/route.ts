import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConfig/dbConfig";
import Innings from "@/models/inningsModel";
import mongoose from "mongoose";

// Connect to database
await connect();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
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
    if (!inningsId || !batsmanId || !bowlerId) {
      return NextResponse.json(
        { error: "Innings ID, batsman ID, and bowler ID are required" },
        { status: 400 }
      );
    }

    // Find the innings
    const innings = await Innings.findById(inningsId);
    if (!innings) {
      return NextResponse.json({ error: "Innings not found" }, { status: 404 });
    }

    // Check if innings is ongoing
    if (innings.status !== "ongoing") {
      return NextResponse.json(
        { error: "Cannot update a completed innings" },
        { status: 400 }
      );
    }

    // Start a transaction for data consistency
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get the Over model dynamically
      const Over = mongoose.model('overs');
      
      // Check if we need to start a new over
      let currentOver;
      
      if (innings.overs.length === 0 || 
          (innings.current_ball >= 6 && !extras?.wides && !extras?.no_balls)) {
        // Create a new over
        currentOver = new Over({
          match_id: innings.match_id,
          innings_id: innings._id,
          over_number: innings.overs.length + 1,
          bowler: bowlerId,
          balls: []
        });
        
        // Save the over
        const savedOver = await currentOver.save({ session });
        
        // Update innings with the new over
        innings.overs.push(savedOver._id);
        innings.current_over = savedOver.over_number;
        innings.current_ball = 0;
      } else {
        // Get the current over
        const overIds = innings.overs;
        if (overIds.length === 0) {
          throw new Error("No overs found for this innings");
        }
        
        const latestOverId = overIds[overIds.length - 1];
        currentOver = await Over.findById(latestOverId);
        
        if (!currentOver) {
          throw new Error("Current over not found");
        }
      }

      // Create the ball object
      const ballNumber = innings.current_ball + 1;
      const ballData = {
        ball_number: ballNumber,
        batsman: batsmanId,
        bowler: bowlerId,
        runs: runs || 0,
        wicket: {
          fallen: !!isWicket,
          wicketType: isWicket ? wicketType : undefined,
          fielder: (isWicket && fielderId) ? fielderId : undefined,
          batsmanOut: isWicket ? batsmanId : undefined // Add this field
        },
        extras: extras || {
          wides: 0,
          no_balls: 0,
          byes: 0,
          leg_byes: 0
        }
      };

      // Add the ball to the over
      currentOver.balls.push(ballData);
      await currentOver.save({ session });

      // Update innings data
      // 1. Update run count
      innings.runs += runs || 0;
      
      // 2. Update extras
      if (extras) {
        innings.extras.wides += extras.wides || 0;
        innings.extras.no_balls += extras.no_balls || 0;
        innings.extras.byes += extras.byes || 0;
        innings.extras.leg_byes += extras.leg_byes || 0;
        
        // Add extra runs to total
        innings.runs += (extras.wides || 0) + (extras.no_balls || 0) + 
                        (extras.byes || 0) + (extras.leg_byes || 0);
      }
      
      // 3. Update wickets if applicable
      if (isWicket) {
        innings.wickets += 1;
        
        // Update batsman stats
        const batsmanIndex = innings.batsmen.findIndex(
          b => b.player_id.toString() === batsmanId.toString()
        );
        
        if (batsmanIndex !== -1) {
          innings.batsmen[batsmanIndex].out = true;
          innings.batsmen[batsmanIndex].dismissal_type = wicketType;
          
          if (["bowled", "lbw", "caught", "stumped"].includes(wicketType)) {
            innings.batsmen[batsmanIndex].dismissed_by.bowler = bowlerId;
          }
          
          if (["caught", "stumped", "run out"].includes(wicketType) && fielderId) {
            innings.batsmen[batsmanIndex].dismissed_by.fielder = fielderId;
          }
        }
        
        // Update bowler stats
        if (["bowled", "lbw", "caught", "stumped"].includes(wicketType)) {
          const bowlerIndex = innings.bowlers.findIndex(
            b => b.player_id.toString() === bowlerId.toString()
          );
          
          if (bowlerIndex !== -1) {
            innings.bowlers[bowlerIndex].wickets += 1;
          }
        }
      }
      
      // 4. Update batsman stats
      const batsmanIndex = innings.batsmen.findIndex(
        b => b.player_id.toString() === batsmanId.toString()
      );
      
      if (batsmanIndex !== -1) {
        // Only count legal deliveries for balls faced
        if (!extras || (!extras.wides && !extras.no_balls)) {
          innings.batsmen[batsmanIndex].balls_faced += 1;
        }
        
        innings.batsmen[batsmanIndex].runs += runs || 0;
        
        if (runs === 4) {
          innings.batsmen[batsmanIndex].fours += 1;
        } else if (runs === 6) {
          innings.batsmen[batsmanIndex].sixes += 1;
        }
      }
      
      // 5. Update bowler stats
      const bowlerIndex = innings.bowlers.findIndex(
        b => b.player_id.toString() === bowlerId.toString()
      );
      
      if (bowlerIndex !== -1) {
        // Count legal deliveries for balls bowled
        if (!extras || (!extras.wides && !extras.no_balls)) {
          innings.bowlers[bowlerIndex].balls_bowled += 1;
          
          // Update overs_bowled
          if (innings.bowlers[bowlerIndex].balls_bowled % 6 === 0) {
            innings.bowlers[bowlerIndex].overs_bowled += 1;
          }
        }
        
        // Add runs conceded
        innings.bowlers[bowlerIndex].runs_conceded += runs || 0;
        
        // Add extras
        if (extras) {
          innings.bowlers[bowlerIndex].no_balls += extras.no_balls || 0;
          innings.bowlers[bowlerIndex].wides += extras.wides || 0;
          innings.bowlers[bowlerIndex].runs_conceded += 
            (extras.wides || 0) + (extras.no_balls || 0);
        }
        
        // Calculate economy
        const totalBalls = innings.bowlers[bowlerIndex].balls_bowled;
        const overs = Math.floor(totalBalls / 6) + (totalBalls % 6) / 10;
        innings.bowlers[bowlerIndex].economy = 
          overs > 0 ? innings.bowlers[bowlerIndex].runs_conceded / overs : 0;
      }
      
      // 6. Update ball count
      // Only increment for legal deliveries or non-incremental extras
      if (!extras || (!extras.wides && !extras.no_balls)) {
        innings.current_ball += 1;
        
        // Check if over is complete
        if (innings.current_ball >= 6) {
          innings.current_over += 1;
          innings.current_ball = 0;
        }
      }
      
      // Save innings
      await innings.save({ session });
      
      // Commit transaction
      await session.commitTransaction();
      session.endSession();
      
      // Return updated innings with populated data
      const updatedInnings = await Innings.findById(innings._id)
        .populate({
          path: "team.batting_team team.bowling_team",
          select: "teamName shortCode"
        })
        .populate({
          path: "current_batsmen.striker current_batsmen.non_striker current_bowler",
          select: "playerName"
        })
        .populate({
          path: "overs"
        });
        
      return NextResponse.json(updatedInnings);
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error: any) {
    console.error("Error updating ball:", error);
    return NextResponse.json(
      { error: `Failed to update ball: ${error.message}` },
      { status: 500 }
    );
  }
}
