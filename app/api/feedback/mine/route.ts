import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getFeedbackForUser } from "@/lib/feedback";

// Powers the "get in touch" modal's reply thread and its unread red dot —
// logged-out visitors have nothing tied to them, so they just get an
// empty list rather than a 401.
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json([]);
  }

  const feedback = await getFeedbackForUser(session.user.id);
  return NextResponse.json(
    feedback.map((entry) => ({
      id: entry.id,
      text: entry.text,
      adminReply: entry.adminReply,
      adminReplyAt: entry.adminReplyAt ? entry.adminReplyAt.toISOString() : null,
      replyReadAt: entry.replyReadAt ? entry.replyReadAt.toISOString() : null,
      createdAt: entry.createdAt.toISOString(),
    })),
  );
}
