import { NextRequest, NextResponse } from 'next/server';
import { connect } from "@/dbConfig/dbConfig";
import User from "@/models/userModel";

const connectionPromise = connect();

export async function GET() {
    try {
        await connectionPromise;
        const users = await User.find({})
            .select('username email role _id');

        return NextResponse.json(users);
    } catch (error: any) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
