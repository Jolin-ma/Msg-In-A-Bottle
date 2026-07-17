import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { updateFeedback, type FeedbackUpdate } from "@/lib/feedback";
import { FeedbackStatus, FeedbackCategory } from "@/app/generated/prisma/client";

const VALID_STATUSES = new Set(Object.values(FeedbackStatus));
const VALID_CATEGORIES = new Set(Object.values(FeedbackCategory));

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status: unknown = body?.status;
  const category: unknown = body?.category;
  const archived: unknown = body?.archived;

  if (
    (status !== undefined &&
      (typeof status !== "string" || !VALID_STATUSES.has(status as FeedbackStatus))) ||
    (category !== undefined &&
      (typeof category !== "string" || !VALID_CATEGORIES.has(category as FeedbackCategory))) ||
    (archived !== undefined && typeof archived !== "boolean") ||
    (status === undefined && category === undefined && archived === undefined)
  ) {
    return NextResponse.json({ error: "invalid_update" }, { status: 400 });
  }

  const update: FeedbackUpdate = {};
  if (status !== undefined) update.status = status as FeedbackStatus;
  if (category !== undefined) update.category = category as FeedbackCategory;
  if (archived !== undefined) update.archived = archived as boolean;

  const feedback = await updateFeedback(id, update);
  return NextResponse.json(feedback);
}
