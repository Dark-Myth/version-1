import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConfig/dbConfig";
import mongoose from "mongoose";
import { ensureModelsLoaded } from "@/utils/modelLoader";

// Connect to database
await connect();

// Ensure all models are loaded in the proper order
ensureModelsLoaded();

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Extract match ID from params
    const matchId = params.id;
    
    if (!matchId) {
      return NextResponse.json(
        { error: "Match ID is required" },
        { status: 400 }
      );
    }
    
    console.log(`Fetching match details for ID: ${matchId}`);

    // Get model references dynamically to avoid import issues
    const Match = mongoose.model('matches');
    const Innings = mongoose.model('innings');

    // Find the match with populated team data, tournament data, and innings
    const match = await Match.findById(matchId)
      .populate('team1')
      .populate('team2')
      .populate('tournament_id')
      .lean();

    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    console.log(`Found match: ${match.team1.teamName} vs ${match.team2.teamName}`);

    // Fetch all innings related to this match with detailed population
    const innings = await Innings.find({ match_id: matchId })
      .populate({
        path: 'team.batting_team team.bowling_team',
        select: 'teamName shortCode'
      })
      .populate({
        path: 'current_batsmen.striker current_batsmen.non_striker current_bowler',
        select: 'playerName'
      })
      .lean();

    console.log(`Found ${innings.length} innings for this match`);

    // Add additional population for overs, if they exist
    for (let i = 0; i < innings.length; i++) {
      if (innings[i].overs && innings[i].overs.length > 0) {
        console.log(`Innings ${i+1} has ${innings[i].overs.length} overs`);
      }
    }

    // Attach innings to match object
    const matchWithInnings = {
      ...match,
      innings: innings
    };

    // Return match data with innings
    return NextResponse.json(matchWithInnings);
  } catch (error: any) {
    console.error("Error fetching match details:", error);
    return NextResponse.json(
      { error: `Failed to fetch match details: ${error.message}` },
      { status: 500 }
    );
  }
}
