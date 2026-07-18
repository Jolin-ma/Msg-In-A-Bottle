import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import {
  deleteFeedback,
  markFeedbackReplyRead,
  updateFeedback,
  type FeedbackUpdate,
} from "@/lib/feedback";
import { FeedbackStatus, FeedbackCategory } from "@/app/generated/prisma/client";

const VALID_STATUSES = new Set(Object.values(FeedbackStatus));
const VALID_CATEGORIES = new Set(Object.values(FeedbackCategory));
const MAX_REPLY_LENGTH = 1000;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const { id } = await params;
  const body = await request.json().catch(() => null);

  // The feedback's own author marking an admin reply as seen — separate from
  // the admin-only moderation actions below.
  if (body?.markRead === true) {
    if (!session?.user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    await markFeedbackReplyRead(id, session.user.id);
    return NextResponse.json({ status: "read" });
  }

  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const status: unknown = body?.status;
  const category: unknown = body?.category;
  const archived: unknown = body?.archived;
  const reply: unknown = body?.reply;

  if (
    (status !== undefined &&
      (typeof status !== "string" || !VALID_STATUSES.has(status as FeedbackStatus))) ||
    (category !== undefined &&
      (typeof category !== "string" || !VALID_CATEGORIES.has(category as FeedbackCategory))) ||
    (archived !== undefined && typeof archived !== "boolean") ||
    (reply !== undefined &&
      (typeof reply !== "string" ||
        reply.trim().length === 0 ||
        reply.length > MAX_REPLY_LENGTH)) ||
    (status === undefined &&
      category === undefined &&
      archived === undefined &&
      reply === undefined)
  ) {
    return NextResponse.json({ error: "invalid_update" }, { status: 400 });
  }

  const update: FeedbackUpdate = {};
  if (status !== undefined) update.status = status as FeedbackStatus;
  if (category !== undefined) update.category = category as FeedbackCategory;
  if (archived !== undefined) update.archived = archived as boolean;
  if (reply !== undefined) update.reply = (reply as string).trim();

  const feedback = await updateFeedback(id, update);
  return NextResponse.json(feedback);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await deleteFeedback(id);
  return NextResponse.json({ status: "deleted" });
}
