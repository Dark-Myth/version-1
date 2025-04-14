import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/dbConfig/dbConfig';
import Innings from '@/models/inningsModel';
import mongoose from 'mongoose';

export async function PUT(request: NextRequest) {
  try {
    await connect();
    
    const { matchId, inningsId, bowlerId } = await request.json();

    console.log("Updating current bowler:", { matchId, inningsId, bowlerId });

    if (!inningsId || !bowlerId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Ensure IDs are valid ObjectIds
    if (!mongoose.Types.ObjectId.isValid(inningsId) ||
        !mongoose.Types.ObjectId.isValid(bowlerId)) {
      return NextResponse.json(
        { error: "Invalid ID format" },
        { status: 400 }
      );
    }

    // Update the innings with the new bowler
    const updatedInnings = await Innings.findByIdAndUpdate(
      inningsId,
      { $set: { current_bowler: bowlerId } },
      { new: true, runValidators: true }
    );

    if (!updatedInnings) {
      return NextResponse.json(
        { error: "Innings not found" },
        { status: 404 }
      );
    }

    console.log("Successfully updated bowler:", bowlerId);
    return NextResponse.json(updatedInnings);
  } catch (error) {
    console.error("Error updating bowler:", error);
    return NextResponse.json(
      { error: "Failed to update bowler", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
