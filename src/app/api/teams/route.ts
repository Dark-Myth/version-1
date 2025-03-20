import { NextResponse } from "next/server";
import { connect } from "@/dbConfig/dbConfig";
import Team from "@/models/teamsModel";
import Tournament from "@/models/tournamentsModel";

// Connect to database outside the request handler to share the connection
const connectionPromise = connect();

export async function GET(request: Request) {
  try {
    // Wait for the connection to be established
    await connectionPromise;
    
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get("tournamentId");
    const tournamentYear = searchParams.get("tournamentYear");
    
    console.log('Query params:', { tournamentId, tournamentYear });
    
    // Base query to find all teams
    let teams = [];
    
    if (tournamentId && tournamentId !== "all") {
      console.log(`Filtering teams by tournament ID: ${tournamentId}`);
      
      // First, verify the tournament exists
      const tournament = await Tournament.findById(tournamentId).lean();
      console.log('Found tournament:', tournament ? tournament.tournamentName : 'Not found');
      
      // If a tournament ID is provided, find teams in that tournament
      teams = await Team.find({ tournament_id: tournamentId }).lean();
      console.log(`Found ${teams.length} teams for tournament`);
      
      // Format the teams data
      teams = teams.map(team => ({
        _id: team._id,
        teamName: team.teamName,
        shortCode: team.shortCode || team.teamName.substring(0, 3).toUpperCase(),
        captain: typeof team.captain === 'object' ? team.captain.name : team.captain || "Unknown",
        playerCount: Array.isArray(team.players) ? team.players.length : 0,
        status: team.status || "active",
        tournament: tournament?.tournamentName || "Unknown"
      }));
    } 
    else if (tournamentYear) {
      console.log(`Filtering teams by tournament year: ${tournamentYear}`);
      
      // If a year is provided, find tournaments in that year
      const tournaments = await Tournament.find({}).lean();
      console.log(`Found ${tournaments.length} total tournaments`);
      
      // Filter tournaments by year
      const filteredTournaments = tournaments.filter((tournament) => {
        if (!tournament.startDate) return false;
        const startDate = new Date(tournament.startDate);
        return startDate.getFullYear() === parseInt(tournamentYear, 10);
      });
      
      console.log(`Found ${filteredTournaments.length} tournaments for year ${tournamentYear}`);
      
      // Debug tournament IDs
      const tournamentIds = filteredTournaments.map((tournament) => tournament._id);
      console.log('Tournament IDs for query:', tournamentIds);
      
      // Find teams in these tournaments
      teams = await Team.find({
        tournament_id: { $in: tournamentIds }
      }).lean();
      
      console.log(`Found ${teams.length} teams for the year ${tournamentYear}`);
      
      // Debug team tournament IDs
      const teamTournamentIds = teams.map(team => team.tournament_id?.toString());
      console.log('Team tournament IDs:', teamTournamentIds);
      
      // Format the teams data
      teams = teams.map(team => {
        const matchingTournament = filteredTournaments.find(t => 
          t._id.toString() === team.tournament_id?.toString()
        );
        
        return {
          _id: team._id,
          teamName: team.teamName,
          shortCode: team.shortCode || team.teamName.substring(0, 3).toUpperCase(),
          captain: typeof team.captain === 'object' ? team.captain.name : team.captain || "Unknown",
          playerCount: Array.isArray(team.players) ? team.players.length : 0,
          status: team.status || "active",
          tournament: matchingTournament?.tournamentName || "Unknown"
        };
      });
    } 
    else {
      console.log('Fetching all teams without filters');
      
      // If no filters, return all teams without population that might fail
      teams = await Team.find({}).lean();
      console.log(`Found ${teams.length} total teams`);
      
      // Get all tournaments in a single query
      const allTournaments = await Tournament.find({}).lean();
      console.log(`Found ${allTournaments.length} total tournaments`);
      
      const tournamentMap = new Map();
      
      // Create a map for fast lookups using _id as the key
      allTournaments.forEach(tournament => {
        // Make sure we're using _id, not tournament_id which might not exist
        if (tournament._id) {
          tournamentMap.set(tournament._id.toString(), tournament);
        }
      });
      
      console.log(`Created tournament map with ${tournamentMap.size} entries`);
      
      // Map teams with their tournaments
      teams = teams.map(team => {
        // Look up tournament from the map using team.tournament_id
        let tournamentName = "Unknown";
        let tournamentYear = null;
        
        if (team.tournament_id) {
          const tournamentIdStr = team.tournament_id.toString();
          const tournament = tournamentMap.get(tournamentIdStr);
          
          if (tournament) {
            tournamentName = tournament.tournamentName;
            tournamentYear = tournament.startDate ? new Date(tournament.startDate).getFullYear() : null;
          } else {
            console.log(`No tournament found for ID: ${tournamentIdStr}`);
          }
        }
        
        return {
          _id: team._id,
          teamName: team.teamName || "Unnamed Team",
          shortCode: team.shortCode || team.teamName?.substring(0, 3).toUpperCase() || "UNK",
          captain: typeof team.captain === 'object' ? team.captain.name : team.captain || "Unknown",
          tournament: tournamentName,
          tournamentYear: tournamentYear,
          playerCount: Array.isArray(team.players) ? team.players.length : 0,
          status: team.status || "active",
          coach: team.coach || "Not specified"
        };
      });
    }
    
    return NextResponse.json(teams);
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Wait for the connection to be established
    await connectionPromise;
    
    const body = await request.json();
    
    // Validate required fields, but with fewer requirements
    if (!body.teamName) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      );
    }
    
    // Create the team with optional fields
    const newTeam = await Team.create({
      teamName: body.teamName,
      shortCode: body.shortCode || body.teamName.substring(0, 3).toUpperCase(),
      tournament_id: body.tournament_id,
      players: body.players || [],
      captain: body.captain,
      viceCaptain: body.viceCaptain,
      wicketKeeper: body.wicketKeeper,
      coach: body.coach,
      status: body.status || "active"
    });
    
    return NextResponse.json(newTeam, { status: 201 });
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json(
      { error: "Failed to create team", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}