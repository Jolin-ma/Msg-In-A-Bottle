import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { createFeedback, getAllFeedback, isValidFeedbackText } from "@/lib/feedback";
import { clientIp, rateLimit } from "@/lib/rateLimit";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  if (!rateLimit(`feedback:${clientIp(request)}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const text: unknown = body?.text;
  const contactEmail: unknown = body?.contactEmail;

  if (
    !isValidFeedbackText(text) ||
    (contactEmail !== undefined &&
      contactEmail !== null &&
      contactEmail !== "" &&
      (typeof contactEmail !== "string" || !EMAIL_PATTERN.test(contactEmail)))
  ) {
    return NextResponse.json({ error: "invalid_feedback" }, { status: 400 });
  }

  const email =
    typeof contactEmail === "string" && contactEmail.trim() ? contactEmail.trim() : null;

  const session = await auth();
  const feedback = await createFeedback(text.trim(), email, session?.user?.id ?? null);
  return NextResponse.json({ id: feedback.id }, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const feedback = await getAllFeedback();
  return NextResponse.json(feedback);
}
