import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { createFeedback, getAllFeedback, isValidFeedbackText } from "@/lib/feedback";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
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

  const feedback = await createFeedback(text.trim(), email);
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
