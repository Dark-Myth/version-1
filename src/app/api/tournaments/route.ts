import { NextResponse } from "next/server";
import Tournament from "@/models/tournamentsModel";
import { connect } from "@/dbConfig/dbConfig";

export async function GET() {
  try {
    await connect();
    const tournaments = await Tournament.find({});
    return NextResponse.json(tournaments);
    
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tournaments"}, { status: 500 });
  }
}