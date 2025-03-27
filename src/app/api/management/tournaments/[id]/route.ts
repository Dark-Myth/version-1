import { NextRequest, NextResponse } from 'next/server';
import { connect } from "@/dbConfig/dbConfig";
import Tournament from "@/models/tournamentsModel";

const connectionPromise = connect();

export async function GET(
    request: NextRequest,
    {params}: {params: {id: string}}
) {
    try {
        await connectionPromise;
        
        // Get params safely using the context object
        const { id } = await params;

        
        if (!id) {
            return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 });
        }
        
        // Validate that the ID is in the correct format for MongoDB
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return NextResponse.json({ error: 'Invalid tournament ID format' }, { status: 400 });
        }
        
        const tournament = await Tournament.findById(id);
        
        if (!tournament) {
            return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
        }

        return NextResponse.json({
            id: tournament._id,
            name: tournament.tournamentName,
            format: tournament.format,
            startDate: tournament.startDate,
            endDate: tournament.endDate,
            teams: tournament.teams,
            matches: tournament.matches,
            hostedBy: tournament.hostedBy,
            venue: tournament.venue,
            description: tournament.description,
            rules: tournament.rules,
            prize: tournament.prize,
            entryFee: tournament.entryFee,
            userManagers: tournament.userManagers,
        });
    } catch (error: any) {
        console.error('Error fetching tournament:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH method with fixed params handling
export async function PATCH(
    request: NextRequest,
    context: { params: { id: string } }
) {
    try {
        await connectionPromise;
        
        const params = context.params;
        const id = params?.id;
        
        if (!id) {
            return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 });
        }
        
        const requestData = await request.json();
        
        // Validate the input data here if needed
        
        const updatedTournament = await Tournament.findByIdAndUpdate(
            id,
            { $set: requestData },
            { new: true, runValidators: true }
        );
        
        if (!updatedTournament) {
            return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
        }
        
        return NextResponse.json({
            message: 'Tournament updated successfully',
            tournament: updatedTournament
        });
    } catch (error: any) {
        console.error('Error updating tournament:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE method with fixed params handling
export async function DELETE(
    request: NextRequest,
    context: { params: { id: string } }
) {
    try {
        await connectionPromise;
        
        const params = context.params;
        const id = params?.id;
        
        if (!id) {
            return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 });
        }
        
        const deletedTournament = await Tournament.findByIdAndDelete(id);
        
        if (!deletedTournament) {
            return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
        }
        
        return NextResponse.json({
            message: 'Tournament deleted successfully'
        });
    } catch (error: any) {
        console.error('Error deleting tournament:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}