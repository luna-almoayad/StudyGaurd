import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Profile from "@/models/Profile";
import mongoose from "mongoose";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: "Invalid profile id" }, { status: 400 });
  }
  const profile = await Profile.findById(params.id)
    .select("name username avatar totalScore totalSessions")
    .lean();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({
    profile: {
      id: profile._id.toString(),
      name: profile.name,
      username: profile.username,
      avatar: profile.avatar,
      totalScore: profile.totalScore,
      totalSessions: profile.totalSessions,
    },
  });
}
