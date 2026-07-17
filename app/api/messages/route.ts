import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateRoom, makeRoomPrivate } from "@/lib/rooms";

const MAX_TEXT_LENGTH = 500;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const roomSlug: unknown = body?.roomSlug;
  const text: unknown = body?.text;
  const makePrivate: unknown = body?.makePrivate;

  if (
    typeof roomSlug !== "string" ||
    typeof text !== "string" ||
    text.trim().length === 0 ||
    text.length > MAX_TEXT_LENGTH ||
    (makePrivate !== undefined && typeof makePrivate !== "boolean")
  ) {
    return NextResponse.json({ error: "invalid_text" }, { status: 400 });
  }

  const room = await getOrCreateRoom(roomSlug);
  const message = await prisma.message.create({
    data: { text, roomId: room.id },
  });

  if (makePrivate === true && room.isPublic) {
    await makeRoomPrivate(room.id);
  }

  return NextResponse.json(message, { status: 201 });
}
