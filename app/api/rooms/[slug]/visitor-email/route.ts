import { NextResponse } from "next/server";
import { getRoomBySlug, setVisitorEmail } from "@/lib/rooms";
import { clientIp, rateLimit } from "@/lib/rateLimit";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

// No auth required — anyone holding the link can already post messages
// anonymously (see POST /api/messages), so opting the same visitor in to a
// reply notification carries no extra trust requirement.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!rateLimit(`visitor-email:${clientIp(request)}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const email: unknown = body?.email;

  if (typeof email !== "string" || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const { slug } = await params;
  const room = await getRoomBySlug(slug);

  // Diary bottles have no visitors to notify — same not-found response as
  // everywhere else a stranger touches one.
  if (!room || room.isDiary) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await setVisitorEmail(room.id, email.trim().toLowerCase());
  return NextResponse.json({ status: "ok" });
}
