import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/dbConfig/dbConfig';
import Innings from '@/models/inningsModel';
import mongoose from 'mongoose';

export async function PUT(request: NextRequest) {
  try {
    await connect();
    
    const { matchId, inningsId, striker, nonStriker } = await request.json();

    console.log("Updating batsmen:", { inningsId, striker, nonStriker });

    if (!inningsId || !striker || !nonStriker) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Ensure IDs are valid ObjectIds
    if (!mongoose.Types.ObjectId.isValid(inningsId) || 
        !mongoose.Types.ObjectId.isValid(striker) ||
        !mongoose.Types.ObjectId.isValid(nonStriker)) {
      return NextResponse.json(
        { error: "Invalid ID format" },
        { status: 400 }
      );
    }

    // Update the innings with the new batsmen
    const updatedInnings = await Innings.findByIdAndUpdate(
      inningsId,
      {
        $set: {
          'current_batsmen.striker': striker,
          'current_batsmen.non_striker': nonStriker
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedInnings) {
      return NextResponse.json(
        { error: "Innings not found" },
        { status: 404 }
      );
    }

    console.log("Successfully updated batsmen");
    return NextResponse.json(updatedInnings);
  } catch (error) {
    console.error("Error updating batsmen:", error);
    return NextResponse.json(
      { error: "Failed to update batsmen", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
