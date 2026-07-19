import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rateLimit";

const MAX_TEXT_LENGTH = 500;
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 5 * 60 * 1000;

export async function POST(request: Request) {
  if (!rateLimit(`messages:${clientIp(request)}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const roomSlug: unknown = body?.roomSlug;
  const text: unknown = body?.text;

  if (
    typeof roomSlug !== "string" ||
    typeof text !== "string" ||
    text.trim().length === 0 ||
    text.length > MAX_TEXT_LENGTH
  ) {
    return NextResponse.json({ error: "invalid_text" }, { status: 400 });
  }

  // Lookup only — posting to a slug that doesn't exist must not create a
  // room (rooms are only born via POST /api/bottles).
  const room = await prisma.room.findUnique({
    where: { slug: roomSlug },
    select: { id: true, isDiary: true, ownerId: true },
  });
  if (!room) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Diary bottles are private journals: only their owner may write, and
  // strangers get the same response as for a room that doesn't exist.
  if (room.isDiary) {
    const session = await auth();
    if (!session?.user || session.user.id !== room.ownerId) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
  }

  const message = await prisma.message.create({
    data: { text: text.trim(), roomId: room.id },
  });

  return NextResponse.json(message, { status: 201 });
}
