import { NextResponse } from "next/server";
import PointsTable from "@/models/pointstablesModel";
import Tournament from "@/models/tournamentsModel";
import Team from "@/models/teamsModel";
import { connect } from "@/dbConfig/dbConfig";
export async function GET(request: Request) {
  console.log("pointsTable route hit");
  const { searchParams } = new URL(request.url);
  const tournamentYear = searchParams.get("tournamentYear");
  const tournamentId = searchParams.get("tournamentId");

  try {
    await connect();
    
    let tournamentIds = [];
    
    if (tournamentId) {
      // If a specific tournament ID is provided, use it
      tournamentIds = [tournamentId];
    } else if (tournamentYear) {
      // If only a year is provided, find all tournaments for that year
      const tournaments = await Tournament.find({});
      
      // Filter tournaments by year
      const filteredTournaments = tournaments.filter((tournament) => {
        const startDate = new Date(tournament.startDate);
        return startDate.getFullYear() === parseInt(tournamentYear, 10);
      });
      
      // Get tournament IDs
      tournamentIds = filteredTournaments.map((tournament) => tournament._id);
    } else {
      // If neither is provided, fetch the most recent tournament
      const latestTournament = await Tournament.findOne().sort({ startDate: -1 });
      if (latestTournament) {
        tournamentIds = [latestTournament._id];
      }
    }
    
    console.log("Tournament IDs for query:", tournamentIds);
    
    if (tournamentIds.length === 0) {
      return NextResponse.json([]);
    }
    
    // Query the points table with those tournament IDs
    const pointsTable = await PointsTable.find({
      tournament_id: { $in: tournamentIds }
    }).populate('team_id');
    
    console.log("Query Result:", pointsTable);

    // If the populate is not working, retrieve team data separately
    const formattedPointsTable = await Promise.all(pointsTable.map(async (entry) => {
      // Find the team separately if population didn't work
      const team = await Team.findOne({ _id: entry.team_id });
      
      return {
        team_id: entry.team_id,
        teamName: team ? team.teamName : "Unknown Team",
        matchesPlayed: entry.matchesPlayed || 0,
        matchesWon: entry.matchesWon || 0,
        matchesLost: entry.matchesLost || 0,
        points: entry.points || 0,
        netRunRate: entry.netRunRate || 0,
        tournamentId: entry.tournament_id
      };
    }));

    // Sort by points (highest first) and then by net run rate (highest first)
    const sortedPointsTable = formattedPointsTable.sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points; // Sort by points descending
      }
      return b.netRunRate - a.netRunRate; // If points are equal, sort by NRR descending
    });

    return NextResponse.json(sortedPointsTable);
  } catch (error) {
    console.error("Error fetching points table:", error);
    return NextResponse.json({ error: "Failed to fetch points table" }, { status: 500 });
  }
}