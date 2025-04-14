import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/dbConfig/dbConfig';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    // Ensure database is connected and models are loaded
    await connect();
    
    const body = await request.json();
    const { matchId, inningsId, bowlerId, createEmptyOver } = body;
    
    if (!matchId || !inningsId) {
      return NextResponse.json(
        { error: 'Match ID and innings ID are required' },
        { status: 400 }
      );
    }

    // Get models after connection is established
    const Innings = mongoose.models.innings;
    const Over = mongoose.models.overs;
    
    if (!Innings || !Over) {
      return NextResponse.json(
        { error: 'Required models not found' },
        { status: 500 }
      );
    }

    // Find the innings
    const innings = await Innings.findById(inningsId);
    if (!innings) {
      return NextResponse.json(
        { error: 'Innings not found' },
        { status: 404 }
      );
    }

    // Create new over as a separate document first
    const overNumber = innings.overs ? innings.overs.length + 1 : 1;
    
    // Create the over as a proper document with proper fields
    const newOver = new Over({
      match_id: matchId,
      innings_id: inningsId,
      over_number: overNumber,
      bowler: bowlerId || null,
      balls: []
    });
    
    // Save the over document to get a valid _id
    const savedOver = await newOver.save();
    console.log("Created new over document:", savedOver._id);
    
    // Initialize overs array if it doesn't exist
    if (!innings.overs) {
      innings.overs = [];
    }
    
    // Push the ObjectId of the saved over to the innings
    innings.overs.push(savedOver._id);
    
    // If a bowler is provided, update the current bowler
    if (bowlerId && !createEmptyOver) {
      innings.current_bowler = bowlerId;
    }
    
    // Save the innings with the new over reference
    await innings.save();
    
    // Return the updated innings with populated overs
    const updatedInnings = await Innings.findById(inningsId).populate('overs');
    return NextResponse.json(updatedInnings);
    
  } catch (error) {
    console.error("Error creating new over:", error);
    return NextResponse.json(
      { 
        error: 'Failed to create new over',
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
