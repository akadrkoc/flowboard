import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

export async function GET() {
  try {
    const mongoose = await connectDB();
    return NextResponse.json({
      status: "ok",
      message: "MongoDB connected successfully",
      readyState: mongoose.connection.readyState,
      dbName: mongoose.connection.db?.databaseName,
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: (error as Error).message },
      { status: 500 }
    );
  }
}
