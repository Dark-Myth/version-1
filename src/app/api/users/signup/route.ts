import {connect} from '@/dbConfig/dbConfig';
import User from '@/models/userModel';
import { NextResponse,NextRequest } from 'next/server';
import bcryptjs from 'bcryptjs';

connect()

export async function POST(request: NextRequest) {
    try{
        console.log("Request body");
        const reqBody = await request.json();
        const {username, email, password, provider = "credentials"} = reqBody;
        console.log(reqBody)

        //If the user already exists
        const user = await User.findOne({email});
        if(user){
            return NextResponse.json({error: "User already exists"}, {status:400});
        }

        const salt = bcryptjs.genSaltSync(10);
        const hashedPassword = bcryptjs.hashSync(password, salt);

        //Create a new user
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            provider
        });

        const savedUser = await newUser.save();
        console.log(savedUser);

        return NextResponse.json({
            message: "User created successfully",
            status:true,
            savedUser
        });


     } catch (error) {
            return NextResponse.json({ error: (error as Error).message }, { status: 500 });
        }
}