import { NextResponse } from "next/server";
import { getRandomPublicRoom } from "@/lib/rooms";

export async function GET() {
  const room = await getRandomPublicRoom();
  if (!room) {
    return NextResponse.json({ error: "no_public_rooms" }, { status: 404 });
  }
  return NextResponse.json(room);
}
