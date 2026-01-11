import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Profile from "@/models/Profile";

const key = (value: string) => value.trim().toLowerCase();

export async function GET() {
  await dbConnect();
  const profiles = await Profile.find({})
    .select("name username avatar totalScore totalSessions")
    .sort({ name: 1 })
    .lean();
  const normalized = profiles.map((profile) => ({
    id: profile._id.toString(),
    name: profile.name,
    username: profile.username,
    avatar: profile.avatar,
    totalScore: profile.totalScore,
    totalSessions: profile.totalSessions,
  }));
  return NextResponse.json({ profiles: normalized });
}

export async function POST(request: NextRequest) {
  await dbConnect();
  const { name, username, avatar } = await request.json();

  const cleanedName = String(name || "").trim();
  const cleanedUsername = String(username || "").trim();

  if (!cleanedName || !cleanedUsername) {
    return NextResponse.json(
      { error: "name and username required" },
      { status: 400 }
    );
  }

  const usernameKey = key(cleanedUsername);
  const existing = await Profile.findOne({ usernameKey }).lean();
  if (existing) {
    return NextResponse.json(
      { error: "username already exists" },
      { status: 409 }
    );
  }

  const profile = await Profile.create({
    name: cleanedName,
    username: cleanedUsername,
    usernameKey,
    avatar: String(avatar || "✨"),
  });

  return NextResponse.json(
    {
      profile: {
        id: profile._id.toString(),
        name: profile.name,
        username: profile.username,
        avatar: profile.avatar,
        totalScore: profile.totalScore,
        totalSessions: profile.totalSessions,
      },
    },
    { status: 201 }
  );
}
