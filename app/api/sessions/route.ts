import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import mongoose from "mongoose";
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

  const sanitizeProfileId = (value: unknown) => {
    const str = typeof value === "string" ? value : "";
    return mongoose.Types.ObjectId.isValid(str) ? str : undefined;
  };

  const cleanParticipants = participants.map((p: { name?: string; profileId?: string }) => ({
    name: String(p?.name || "").trim(),
    profileId: sanitizeProfileId(p?.profileId),
  }));

  const cleanResults = results.map(
    (r: { name?: string; profileId?: string; points?: number; distractions?: number }) => ({
      name: String(r?.name || "").trim(),
      profileId: sanitizeProfileId(r?.profileId),
      points: Number(r?.points) || 0,
      distractions: Number(r?.distractions) || 0,
    })
  );

  const session = await Session.create({
    sessionName: String(sessionName).trim(),
    topic: String(topic).trim(),
    hostProfileId: sanitizeProfileId(hostProfileId),
    participants: cleanParticipants,
    results: cleanResults,
    duration,
    startedAt,
    endedAt,
  });

  const updates = cleanResults
    .filter((r) => r.profileId)
    .map((r) => ({
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
