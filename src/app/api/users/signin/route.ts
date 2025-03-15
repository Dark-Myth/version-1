import { connect } from '@/dbConfig/dbConfig';
import User from '@/models/userModel';
import { NextResponse, NextRequest } from 'next/server';
import bcryptjs from 'bcryptjs';

connect();

export async function POST(request: NextRequest) {
    try {
        console.log("Request body");
        const reqBody = await request.json();
        const { email, password, provider = "credentials" } = reqBody;
        console.log(reqBody);

        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if the user is using credentials provider
        if (provider === "credentials") {
            // Check if the password is correct
            const isPasswordValid = bcryptjs.compareSync(password, user.password);
            if (!isPasswordValid) {
                return NextResponse.json({ error: "Invalid password" }, { status: 401 });
            }
        }

        // Return success response
        return NextResponse.json({
            message: "User signed in successfully",
            status: true,
            user
        });

    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}