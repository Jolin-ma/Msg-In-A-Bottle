import { after, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { sendNewMessageEmail } from "@/lib/email";

const MAX_TEXT_LENGTH = 500;
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 5 * 60 * 1000;

// Caps how often a single room can trigger an owner notification email, so
// a burst of replies to one bottle doesn't flood the owner's inbox.
const EMAIL_NOTIFY_WINDOW_MS = 5 * 60 * 1000;

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
    select: {
      id: true,
      isDiary: true,
      ownerId: true,
      name: true,
      owner: { select: { email: true } },
    },
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

  // Diary replies can't happen (only the owner ever writes there), so this
  // is always "someone else replied to my bottle" — notify the owner.
  if (
    !room.isDiary &&
    room.owner?.email &&
    rateLimit(`email:room:${room.id}`, 1, EMAIL_NOTIFY_WINDOW_MS)
  ) {
    const ownerEmail = room.owner.email;
    const roomName = room.name;
    after(() => sendNewMessageEmail(ownerEmail, roomSlug, roomName));
  }

  return NextResponse.json(message, { status: 201 });
}
