import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Profile from "@/models/Profile";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
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
