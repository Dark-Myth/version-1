// Route: /api/management/teams/player-role
// Methods: POST
// Purpose: Update player roles within a team (captain, vice-captain, wicket-keeper)

import { NextRequest, NextResponse } from 'next/server';
import { connect } from "@/dbConfig/dbConfig";
import Team from "@/models/teamsModel";

const connectionPromise = connect();

// POST - Update player role in a team (captain, vice captain, wicket keeper)
export async function POST(request: NextRequest) {
  try {
    await connectionPromise;
    
    const body = await request.json();
    const { teamId, playerId, role } = body;
    
    if (!teamId || !playerId || !role) {
      return NextResponse.json({ 
        error: 'Team ID, Player ID, and role are required' 
      }, { status: 400 });
    }
    
    // Validate role
    if (!['captain', 'viceCaptain', 'wicketKeeper'].includes(role)) {
      return NextResponse.json({ 
        error: 'Role must be captain, viceCaptain, or wicketKeeper' 
      }, { status: 400 });
    }
    
    // Find the team
    const team = await Team.findById(teamId);
    
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }
    
    // Check if player is in the team
    if (!team.players || !team.players.some(id => id.toString() === playerId)) {
      return NextResponse.json({ error: 'Player not found in this team' }, { status: 404 });
    }
    
    // Use the team's method to assign the role
    const result = await team.assignRole(playerId, role);
    
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
    
    return NextResponse.json({ 
      message: `Player successfully assigned as ${role}`,
      result: result
    });
  } catch (error: any) {
    console.error("Error updating player role:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}