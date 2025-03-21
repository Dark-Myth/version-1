import { NextResponse } from "next/server";
import { connect } from "@/dbConfig/dbConfig";
import mongoose from "mongoose";
import Match from "@/models/matchesModel";
import Innings from "@/models/inningsModel"; // Import correctly 
import Overs from "@/models/oversModel";

// Connect to database outside the request handler to share the connection
const connectionPromise = connect();

export async function GET(request: Request) {
  try {
    // Wait for the connection to be established
    await connectionPromise;
    
    // Explicitly ensure all models are registered with the correct casing
    // This is the key fix - reference models by their exact registration name
    const InningsModel = mongoose.models.innings || Innings;
    const OversModel = mongoose.models.overs || Overs;
    
    // Fix date handling to avoid mutation issues
    const now = new Date();
    
    // Create separate date objects for today's start and end
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    
    // Create tomorrow date for upcoming matches filter
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Find all ongoing matches - these have the highest priority
    let ongoingMatches = [];
    try {
      ongoingMatches = await Match.find({ status: "ongoing" })
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
          path: "winningTeam",
          select: "teamName shortCode"
        })
        .populate({
          path: "innings"
        })
        .sort({ date: 1, time: 1 })
        .lean();
        
      // If we got matches with innings, now populate the deeper levels
      if (ongoingMatches.length > 0) {
        // Do deeper population in a separate step if needed
        for (let i = 0; i < ongoingMatches.length; i++) {
          if (ongoingMatches[i].innings && ongoingMatches[i].innings.length > 0) {
            for (let j = 0; j < ongoingMatches[i].innings.length; j++) {
              try {
                // Use the correct model reference
                const populatedInnings = await InningsModel.findById(ongoingMatches[i].innings[j]._id)
                  .populate({
                    path: "team.batting_team",
                    select: "teamName shortCode"
                  })
                  .populate({
                    path: "team.bowling_team",
                    select: "teamName shortCode"
                  })
                  .populate({
                    path: "overs"
                  })
                  .lean();
                  
                if (populatedInnings) {
                  ongoingMatches[i].innings[j] = populatedInnings;
                  
                  // Populate the balls in each over if needed
                  if (populatedInnings.overs && populatedInnings.overs.length > 0) {
                    for (let k = 0; k < populatedInnings.overs.length; k++) {
                      try {
                        // Use the correct model reference
                        const populatedOver = await OversModel.findById(populatedInnings.overs[k]._id)
                          .populate({
                            path: "balls.batsman balls.bowler balls.wicket.fielder",
                            select: "playerName"
                          })
                          .lean();
                          
                        if (populatedOver) {
                          ongoingMatches[i].innings[j].overs[k] = populatedOver;
                        }
                      } catch (overError) {
                        console.warn("Failed to populate over:", overError);
                      }
                    }
                  }
                }
              } catch (inningsError) {
                console.warn("Failed to populate innings:", inningsError);
              }
            }
          }
        }
      }
    } catch (matchError) {
      console.error("Error fetching ongoing matches:", matchError);
    }
    
    // Find matches that are scheduled for today but haven't started yet
    // These should be treated differently from upcoming matches
    let todayScheduled = [];
    try {
      todayScheduled = await Match.find({ 
        status: "scheduled",
        date: {
          $gte: startOfToday,
          $lt: endOfToday
        }
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
        .sort({ time: 1 }) // Sort by start time
        .lean();
      
      // Add a flag to indicate these are starting today
      todayScheduled = todayScheduled.map(match => ({
        ...match,
        startingToday: true
      }));
    } catch (todayScheduledError) {
      console.error("Error fetching today's scheduled matches:", todayScheduledError);
    }
    
    // Find completed matches from today
    let todayCompleted = [];
    try {
      todayCompleted = await Match.find({ 
        status: "completed",
        date: {
          $gte: startOfToday,
          $lt: endOfToday
        }
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
          path: "winningTeam",
          select: "teamName shortCode"
        })
        .populate({
          path: "innings"
        })
        .sort({ date: -1, time: -1 })
        .limit(3)
        .lean();
      
      // Add a flag to indicate these were completed today
      todayCompleted = todayCompleted.map(match => ({
        ...match,
        completedToday: true
      }));
    } catch (completedError) {
      console.error("Error fetching completed matches:", completedError);
    }
    
    // Find upcoming matches (tomorrow)
    let upcomingMatches = [];
    try {
      const tomorrowStart = new Date(tomorrow);
      tomorrowStart.setHours(0, 0, 0, 0);
      
      const tomorrowEnd = new Date(tomorrow);
      tomorrowEnd.setHours(23, 59, 59, 999);
      
      upcomingMatches = await Match.find({ 
        status: "scheduled",
        date: {
          $gte: tomorrowStart,
          $lt: tomorrowEnd
        }
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
        .sort({ time: 1 })
        .limit(3)
        .lean();
      
      // Add flag to indicate these are tomorrow's matches
      upcomingMatches = upcomingMatches.map(match => ({
        ...match,
        tomorrowMatch: true
      }));
    } catch (upcomingError) {
      console.error("Error fetching upcoming matches:", upcomingError);
    }
    
    // Combine all matches, prioritizing ongoing, then today's scheduled, then completed today, then upcoming
    const allMatches = [
      ...ongoingMatches,
      ...todayScheduled,
      ...todayCompleted,
      ...upcomingMatches
    ];
    
    // If we have no matches at all, try a simpler fallback approach
    if (allMatches.length === 0) {
      try {
        const fallbackMatches = await Match.find({})
          .sort({ date: -1 })
          .limit(5)
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
            path: "winningTeam",
            select: "teamName shortCode"
          })
          .lean();
        
        return NextResponse.json(fallbackMatches);
      } catch (fallbackError) {
        console.error("Fallback matches query failed:", fallbackError);
      }
    }
    
    return NextResponse.json(allMatches);
  } catch (error) {
    console.error("Error fetching live matches:", error);
    
    // Add debug info to the error response
    let errorDetails = "Unknown error";
    if (error instanceof Error) {
      errorDetails = error.message;
      
      // If it's a Mongoose error, add more details
      if (error instanceof mongoose.Error) {
        errorDetails += ` (${error.constructor.name})`;
      }
    }
    
    return NextResponse.json(
      { 
        error: "Failed to fetch live matches", 
        details: errorDetails
      }, 
      { status: 500 }
    );
  }
}