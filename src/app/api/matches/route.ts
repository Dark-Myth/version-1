import { NextResponse } from "next/server";
import { connect } from "@/dbConfig/dbConfig";
import Match from "@/models/matchesModel";
import Tournament from "@/models/tournamentsModel";

// Connect to database outside the request handler to share the connection
const connectionPromise = connect();

export async function GET(request: Request) {
  try {
    // Wait for the connection to be established
    await connectionPromise;
    
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get("tournamentId");
    const year = searchParams.get("year");
    
    // Base query to find matches
    let matches = [];
    
    if (tournamentId && tournamentId !== "all") {
      // If a tournament ID is provided, find matches in that tournament
      matches = await Match.find({ tournament_id: tournamentId })
        .populate({
          path: 'tournament_id',
          select: 'tournamentName'
        })
        .populate({
          path: 'team1',
          select: 'teamName shortCode'
        })
        .populate({
          path: 'team2',
          select: 'teamName shortCode'
        })
        .populate({
          path: 'winningTeam',
          select: 'teamName shortCode'
        })
        .lean();
    } 
    else if (year) {
      // If a year is provided, find tournaments in that year, then matches in those tournaments
      const tournaments = await Tournament.find({}).lean();
      
      // Filter tournaments by year
      const filteredTournaments = tournaments.filter((tournament) => {
        if (!tournament.startDate) return false;
        const startDate = new Date(tournament.startDate);
        return startDate.getFullYear() === parseInt(year, 10);
      });
      
      const tournamentIds = filteredTournaments.map((tournament) => tournament._id);
      
      // Find matches in these tournaments
      matches = await Match.find({
        tournament_id: { $in: tournamentIds }
      })
        .populate({
          path: 'tournament_id',
          select: 'tournamentName'
        })
        .populate({
          path: 'team1',
          select: 'teamName shortCode'
        })
        .populate({
          path: 'team2',
          select: 'teamName shortCode'
        })
        .populate({
          path: 'winningTeam',
          select: 'teamName shortCode'
        })
        .lean();
    } 
    else {
      // If no filters, return all matches
      matches = await Match.find({})
        .populate({
          path: 'tournament_id',
          select: 'tournamentName'
        })
        .populate({
          path: 'team1',
          select: 'teamName shortCode'
        })
        .populate({
          path: 'team2',
          select: 'teamName shortCode'
        })
        .populate({
          path: 'winningTeam',
          select: 'teamName shortCode'
        })
        .lean();
    }
    
    return NextResponse.json(matches);
  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}