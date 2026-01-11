import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Player from "@/models/Player";

const key = (name) => String(name).trim().toLowerCase();

export async function POST(req) {
  await dbConnect();

  const { players } = await req.json();

  if (!Array.isArray(players) || players.length === 0) {
    return NextResponse.json({ error: "players[] required" }, { status: 400 });
  }

  const cleaned = players
    .map((p) => ({
      name: String(p?.name || "").trim(),
      nameKey: key(p?.name || ""),
      score: Number(p?.score),
    }))
    .filter((p) => p.name && Number.isFinite(p.score));

  if (cleaned.length === 0) {
    return NextResponse.json({ error: "No valid players" }, { status: 400 });
  }

  // SET score to final value (overwrite). If you want cumulative, tell me and I’ll switch to $inc.
  const ops = cleaned.map((p) => ({
    updateOne: {
      filter: { nameKey: p.nameKey },
      update: {
        $set: { name: p.name, score: p.score },
        $setOnInsert: { nameKey: p.nameKey },
      },
      upsert: true,
    },
  }));

  const result = await Player.bulkWrite(ops);

  return NextResponse.json(
    { ok: true, upserted: result.upsertedCount, modified: result.modifiedCount },
    { status: 200 }
  );


}
