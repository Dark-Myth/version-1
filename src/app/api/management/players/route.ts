import { NextResponse } from "next/server";
import { connect } from "@/dbConfig/dbConfig";
import Player from "@/models/playersModel";

const connectionPromise = connect();

export async function GET(request: Request) {
  try {
    await connectionPromise;
    const url = new URL(request.url);
    const searchQuery = url.searchParams.get('search') || '';
    const statusFilter = url.searchParams.get('status') || '';
    
    // Build the query based on filters
    const query: any = {};
    
    if (searchQuery) {
      query.playerName = { $regex: searchQuery, $options: 'i' };
    }
    
    if (statusFilter && statusFilter !== 'all') {
      query.status = statusFilter;
    }
    
    const players = await Player.find(query)
      .select('playerName role battingStyle bowlingStyle status globalStats')
      .sort({ playerName: 1 })
      .lean();

    const formattedPlayers = players.map(player => ({
      id: player._id,
      name: player.playerName,
      role: player.role,
      battingStyle: player.battingStyle || 'N/A',
      bowlingStyle: player.bowlingStyle || 'N/A',
      status: player.status,
      stats: {
        matches: player.globalStats?.batting?.matches || 0,
        runs: player.globalStats?.batting?.runs || 0,
        wickets: player.globalStats?.bowling?.wickets || 0
      }
    }));

    return NextResponse.json(formattedPlayers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectionPromise;
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['playerName', 'role', 'status'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 });
      }
    }

    // Validate role-specific required fields
    if (['batsman', 'all-rounder', 'wicket-keeper'].includes(body.role) && !body.battingStyle) {
      return NextResponse.json({ error: 'Batting style is required for this role' }, { status: 400 });
    }

    if (['bowler', 'all-rounder'].includes(body.role) && !body.bowlingStyle) {
      return NextResponse.json({ error: 'Bowling style is required for this role' }, { status: 400 });
    }

    // Handle default value for bowlingStyle for non-bowling roles
    if ((body.role === 'batsman' || body.role === 'wicket-keeper') && !body.bowlingStyle) {
      body.bowlingStyle = 'N/A';
    }

    const player = await Player.create({
      playerName: body.playerName,
      role: body.role,
      battingStyle: body.battingStyle,
      bowlingStyle: body.bowlingStyle,
      status: body.status
    });

    return NextResponse.json(player, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectionPromise;
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Player ID is required' }, { status: 400 });
    }
    
    const player = await Player.findByIdAndDelete(id);
    
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Player deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectionPromise;
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const body = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'Player ID is required' }, { status: 400 });
    }
    
    // Validate role-specific required fields
    if (['batsman', 'all-rounder', 'wicket-keeper'].includes(body.role) && !body.battingStyle) {
      return NextResponse.json({ error: 'Batting style is required for this role' }, { status: 400 });
    }

    if (['bowler', 'all-rounder'].includes(body.role) && !body.bowlingStyle) {
      return NextResponse.json({ error: 'Bowling style is required for this role' }, { status: 400 });
    }

    // Handle default value for bowlingStyle for non-bowling roles
    if ((body.role === 'batsman' || body.role === 'wicket-keeper') && !body.bowlingStyle) {
      body.bowlingStyle = 'N/A';
    }
    
    const player = await Player.findByIdAndUpdate(
      id,
      {
        playerName: body.playerName,
        role: body.role,
        battingStyle: body.battingStyle,
        bowlingStyle: body.bowlingStyle,
        status: body.status
      },
      { new: true }
    );
    
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }
    
    return NextResponse.json(player);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
