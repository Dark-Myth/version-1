import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/dbConfig/dbConfig';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    await connect();
    
    const body = await request.json();
    const { action, matchId, inningsId, data } = body;
    
    if (!action || !matchId || !inningsId) {
      return NextResponse.json(
        { error: 'Action, match ID, and innings ID are required' },
        { status: 400 }
      );
    }
    
    // Get models
    const Innings = mongoose.models.innings;
    const Over = mongoose.models.overs;
    
    if (!Innings || !Over) {
      return NextResponse.json(
        { error: 'Required models not found' },
        { status: 500 }
      );
    }
    
    // Find the innings
    const innings = await Innings.findById(inningsId).populate('overs');
    if (!innings) {
      return NextResponse.json(
        { error: 'Innings not found' },
        { status: 404 }
      );
    }
    
    let response;
    
    switch (action) {
      case 'newOver':
        const { bowlerId } = data;
        
        // Create new over
        const overNumber = innings.overs ? innings.overs.length + 1 : 1;
        
        // Create a new over document
        const newOver = new Over({
          match_id: matchId,
          innings_id: inningsId,
          over_number: overNumber,
          bowler: bowlerId || null,
          balls: []
        });
        
        // Save the over
        const savedOver = await newOver.save();
        
        // Add to innings
        if (!innings.overs) innings.overs = [];
        innings.overs.push(savedOver._id);
        
        // Update current bowler
        if (bowlerId) innings.current_bowler = bowlerId;
        
        // Save innings
        await innings.save();
        
        response = await Innings.findById(inningsId).populate('overs');
        break;
        
      case 'updateBatsmen':
        const { striker, nonStriker } = data;
        
        // Update current batsmen
        innings.current_batsmen = {
          striker: striker || null,
          non_striker: nonStriker || null
        };
        
        await innings.save();
        response = await Innings.findById(inningsId).populate('overs');
        break;
        
      case 'updateBowler':
        const { newBowlerId } = data;
        
        // Update current bowler
        innings.current_bowler = newBowlerId || null;
        
        await innings.save();
        response = await Innings.findById(inningsId).populate('overs');
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error("Error in live scoring:", error);
    return NextResponse.json(
      { 
        error: 'Failed to process live scoring action',
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
