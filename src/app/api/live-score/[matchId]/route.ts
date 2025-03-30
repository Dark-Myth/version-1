import { NextResponse } from "next/server";
import { connect } from "@/dbConfig/dbConfig";
import mongoose from "mongoose";
import Match from "@/models/matchesModel";
import Innings from "@/models/inningsModel";
import Overs from "@/models/oversModel";

// Connect to database outside the request handler to share the connection
const connectionPromise = connect();

export async function GET(
  request: Request,
  { params }: { params: { matchId: string } }
) {
  try {
    // Wait for the connection to be established
    await connectionPromise;
    
    const matchId = params.matchId;
    if (!matchId || !mongoose.Types.ObjectId.isValid(matchId)) {
      return NextResponse.json({ 
        error: "Invalid match ID"
      }, { status: 400 });
    }

    // Get model references
    const InningsModel = mongoose.models.innings || Innings;
    const OversModel = mongoose.models.overs || Overs;
    
    // Find the match with detailed population
    const match = await Match.findById(matchId)
      .populate({
        path: "tournament_id",
        select: "tournamentName"
      })
      .populate({
        path: "team1",
        select: "teamName logo shortCode"
      })
      .populate({
        path: "team2",
        select: "teamName logo shortCode"
      })
      .populate({
        path: "winningTeam",
        select: "teamName shortCode"
      })
      .populate({
        path: "handler",
        select: "name username"
      })
      .populate({
        path: "innings"
      })
      .lean();

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Populate innings and overs deeply
    if (match.innings && match.innings.length > 0) {
      for (let i = 0; i < match.innings.length; i++) {
        try {
          // Populate innings details
          const populatedInnings = await InningsModel.findById(match.innings[i]._id)
            .populate({
              path: "team.batting_team",
              select: "teamName logo shortCode"
            })
            .populate({
              path: "team.bowling_team",
              select: "teamName logo shortCode"
            })
            .populate({
              path: "overs"
            })
            .lean();

          if (populatedInnings) {
            match.innings[i] = populatedInnings;

            // Populate overs and balls
            if (populatedInnings.overs && populatedInnings.overs.length > 0) {
              for (let j = 0; j < populatedInnings.overs.length; j++) {
                try {
                  const populatedOver = await OversModel.findById(populatedInnings.overs[j]._id)
                    .populate([
                      {
                        path: "bowler",
                        select: "name playerName"
                      },
                      {
                        path: "balls.batsman",
                        select: "name playerName"
                      },
                      {
                        path: "balls.bowler",
                        select: "name playerName"
                      },
                      {
                        path: "balls.wicket.fielder",
                        select: "name playerName"
                      }
                    ])
                    .lean();

                  if (populatedOver) {
                    match.innings[i].overs[j] = populatedOver;
                  }
                } catch (overError) {
                  console.warn(`Failed to populate over ${j} for innings ${i}:`, overError);
                }
              }
            }
          }
        } catch (inningsError) {
          console.warn(`Failed to populate innings ${i}:`, inningsError);
        }
      }
    }

    // Calculate batsman stats
    if (match.innings) {
      for (const innings of match.innings) {
        innings.batsmanStats = calculateBatsmanStats(innings);
        innings.bowlerStats = calculateBowlerStats(innings);
      }
    }

    return NextResponse.json(match);
  } catch (error) {
    console.error("Error fetching match details:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch match details", 
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
  }
}

// Helper function to calculate batsman statistics
function calculateBatsmanStats(innings: any) {
  const batsmanMap = new Map();

  if (!innings.overs) return [];

  for (const over of innings.overs) {
    if (!over.balls) continue;

    for (const ball of over.balls) {
      if (!ball.batsman || !ball.batsman._id) continue;
      
      const batsmanId = ball.batsman._id.toString();
      
      if (!batsmanMap.has(batsmanId)) {
        batsmanMap.set(batsmanId, {
          playerId: batsmanId,
          name: ball.batsman.name || ball.batsman.playerName || "Unknown",
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          isOut: false,
          dismissalType: null
        });
      }
      
      const batsmanStats = batsmanMap.get(batsmanId);
      
      // Regular runs (exclude extras like wides and no-balls)
      if (!ball.extras || (!ball.extras.wides && !ball.extras.no_balls)) {
        batsmanStats.balls++;
      }
      
      // Add runs
      batsmanStats.runs += ball.runs;
      
      // Count boundaries
      if (ball.runs === 4) batsmanStats.fours++;
      if (ball.runs === 6) batsmanStats.sixes++;
      
      // Check for dismissal
      if (ball.wicket && ball.wicket.fallen) {
        batsmanStats.isOut = true;
        batsmanStats.dismissalType = ball.wicket.wicketType;
      }
    }
  }
  
  return Array.from(batsmanMap.values());
}

// Helper function to calculate bowler statistics
function calculateBowlerStats(innings: any) {
  const bowlerMap = new Map();
  
  if (!innings.overs) return [];

  for (const over of innings.overs) {
    if (!over.bowler || !over.bowler._id) continue;
    
    const bowlerId = over.bowler._id.toString();
    
    if (!bowlerMap.has(bowlerId)) {
      bowlerMap.set(bowlerId, {
        playerId: bowlerId,
        name: over.bowler.name || over.bowler.playerName || "Unknown",
        overs: 0,
        maidens: 0,
        runs: 0,
        wickets: 0,
        economy: 0,
        wides: 0,
        noBalls: 0
      });
    }
    
    const bowlerStats = bowlerMap.get(bowlerId);
    
    // Count overs
    let isOverComplete = false;
    let isOverMaiden = true;
    let oversRuns = 0;
    
    if (over.balls && over.balls.length > 0) {
      isOverComplete = over.balls.length === 6 || 
        over.balls.filter(ball => !ball.extras || (!ball.extras.wides && !ball.extras.no_balls)).length === 6;
        
      // Calculate runs and check for maiden
      for (const ball of over.balls) {
        if (ball.runs > 0) {
          isOverMaiden = false;
          oversRuns += ball.runs;
        }
        
        // Count extras
        if (ball.extras) {
          if (ball.extras.wides) {
            bowlerStats.runs += ball.extras.wides;
            bowlerStats.wides += ball.extras.wides;
            oversRuns += ball.extras.wides;
            isOverMaiden = false;
          }
          
          if (ball.extras.no_balls) {
            bowlerStats.runs += ball.extras.no_balls;
            bowlerStats.noBalls += ball.extras.no_balls;
            oversRuns += ball.extras.no_balls;
            isOverMaiden = false;
          }
        }
        
        // Count wickets
        if (ball.wicket && ball.wicket.fallen && 
            ball.wicket.wicketType !== "run out" && 
            ball.wicket.wicketType !== "retired hurt") {
          bowlerStats.wickets++;
        }
      }
      
      if (isOverComplete) {
        bowlerStats.overs++;
        if (isOverMaiden) {
          bowlerStats.maidens++;
        }
      }
      
      // Add the runs from this over
      bowlerStats.runs += oversRuns;
    }
  }
  
  // Calculate economy rate for each bowler
  bowlerMap.forEach(stats => {
    if (stats.overs > 0) {
      stats.economy = parseFloat((stats.runs / stats.overs).toFixed(2));
    }
  });
  
  return Array.from(bowlerMap.values());
}
