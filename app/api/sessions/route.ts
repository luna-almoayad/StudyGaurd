import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Session from "@/models/Session";
import Profile from "@/models/Profile";

export async function GET(request: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get("profileId");

  const filter = profileId
    ? {
        $or: [
          { hostProfileId: profileId },
          { "participants.profileId": profileId },
          { "results.profileId": profileId },
        ],
      }
    : {};

  const sessions = await Session.find(filter)
    .sort({ endedAt: -1 })
    .limit(20)
    .lean();

  return NextResponse.json({ sessions });
}

export async function POST(request: NextRequest) {
  await dbConnect();
  const payload = await request.json();

  const {
    sessionName,
    topic,
    hostProfileId,
    participants = [],
    results = [],
    duration = 0,
    startedAt,
    endedAt,
  } = payload || {};

  if (!sessionName || !topic) {
    return NextResponse.json(
      { error: "sessionName and topic required" },
      { status: 400 }
    );
  }

  const session = await Session.create({
    sessionName: String(sessionName).trim(),
    topic: String(topic).trim(),
    hostProfileId: hostProfileId || undefined,
    participants,
    results,
    duration,
    startedAt,
    endedAt,
  });

  const updates = results
    .filter((r: { profileId?: string; points?: number }) => r.profileId)
    .map((r: { profileId: string; points: number }) => ({
      updateOne: {
        filter: { _id: r.profileId },
        update: {
          $inc: {
            totalScore: Number(r.points) || 0,
            totalSessions: 1,
          },
        },
      },
    }));

  if (updates.length > 0) {
    await Profile.bulkWrite(updates);
  }

  return NextResponse.json({ id: session._id.toString() }, { status: 201 });
}
