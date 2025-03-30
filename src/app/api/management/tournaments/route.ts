import { NextRequest, NextResponse } from 'next/server';
import {connect} from "@/dbConfig/dbConfig";
import Tournament from "@/models/tournamentsModel";

const connectionPromise = connect();

export async function GET(request: Request) {
    try {
        await connectionPromise;
        
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const search = searchParams.get("search");
        
        const query: any = {};
        
        if (status && status !== "all") {
            query.status = status;
        }
        
        if (search) {
            query.tournamentName = { $regex: search, $options: "i" };
        }
        
        const tournaments = await Tournament.find(query)
            .populate({
                path: 'handler',
                select: 'username name'
            })
            .sort({ createdAt: -1 })
            .lean();
        
        console.log(`Found ${tournaments.length} tournaments`);
        
        return NextResponse.json(tournaments);
    } catch (error: any) {
        console.error("Error fetching tournaments:", error);
        return NextResponse.json(
            { error: "Failed to fetch tournaments", details: error instanceof Error ? error.message : String(error) }, 
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        await connectionPromise;
        const body = await request.json();

        // Validate required fields
        const requiredFields = ['name', 'format', 'startDate', 'endDate', 'teams', 'adminId'];
        for (const field of requiredFields) {
            if (!body[field]) {
                return NextResponse.json({ error: `${field} is required` }, { status: 400 });
            }
        }

        // Ensure userManagers is an array and includes the adminId
        let userManagers = Array.isArray(body.userManagers) ? body.userManagers : [];
        if (!userManagers.includes(body.adminId)) {
            userManagers.push(body.adminId);
        }

        const tournament = await Tournament.create({
            tournamentName: body.name,
            format: body.format,
            startDate: new Date(body.startDate),
            endDate: new Date(body.endDate),
            teams: body.teams,
            status: 'scheduled',
            hostedBy: body.hostedBy || 'Admin',
            venue: body.venue || 'TBD',
            description: body.description || 'No description provided',
            rules: Array.isArray(body.rules) ? body.rules : ['Standard cricket rules apply'],
            prize: Array.isArray(body.prize) ? body.prize : ['Trophy for winners'],
            entryFee: body.entryFee || 0,
            handler: body.adminId,
            userManagers: userManagers,
            matches: 0
        });

        return NextResponse.json(tournament, { status: 201 });
    } catch (error: any) {
        console.error("Error creating tournament:", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');
        
        if (!id) {
            return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 });
        }

        const tournament = await Tournament.findByIdAndDelete(id);
        
        if (!tournament) {
            return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Tournament deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        await connectionPromise;
        const url = new URL(request.url);
        const id = url.searchParams.get('id');
        const body = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 });
        }

        // Ensure userManagers is an array
        const userManagers = Array.isArray(body.userManagers) ? body.userManagers : [];

        const tournament = await Tournament.findByIdAndUpdate(
            id,
            {
                tournamentName: body.name,
                format: body.format,
                startDate: new Date(body.startDate),
                endDate: new Date(body.endDate),
                teams: body.teams,
                matches: body.matches || 0,
                hostedBy: body.hostedBy,
                venue: body.venue,
                description: body.description,
                rules: Array.isArray(body.rules) ? body.rules : [],
                prize: Array.isArray(body.prize) ? body.prize : [],
                entryFee: body.entryFee,
                userManagers: userManagers,
            },
            { new: true }
        );

        if (!tournament) {
            return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
        }

        return NextResponse.json(tournament);
    } catch (error: any) {
        console.error('Error updating tournament:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
