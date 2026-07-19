import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { BOTTLE_ICONS } from "@/lib/bottleIcons";
import { createOwnedRoom } from "@/lib/rooms";
import { sanitizeSlug } from "@/lib/slug";
import { Prisma } from "@/app/generated/prisma/client";

const MAX_MESSAGE_LENGTH = 500;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const rawSlug: unknown = body?.slug;
  const rawMessage: unknown = body?.message;
  const rawIsDiary: unknown = body?.isDiary;
  const rawIconIndex: unknown = body?.iconIndex;
  if (
    typeof rawSlug !== "string" ||
    (rawMessage !== undefined &&
      rawMessage !== null &&
      (typeof rawMessage !== "string" || rawMessage.length > MAX_MESSAGE_LENGTH)) ||
    (rawIsDiary !== undefined && typeof rawIsDiary !== "boolean") ||
    (rawIconIndex !== undefined &&
      (typeof rawIconIndex !== "number" ||
        !Number.isInteger(rawIconIndex) ||
        rawIconIndex < 0 ||
        rawIconIndex >= BOTTLE_ICONS.length))
  ) {
    return NextResponse.json({ error: "invalid_slug" }, { status: 400 });
  }

  const slug = sanitizeSlug(rawSlug);
  if (!slug) {
    return NextResponse.json({ error: "invalid_slug" }, { status: 400 });
  }

  const message = typeof rawMessage === "string" ? rawMessage.trim() : null;
  const isDiary = typeof rawIsDiary === "boolean" ? rawIsDiary : false;
  const iconIndex = typeof rawIconIndex === "number" ? rawIconIndex : 0;

  try {
    const room = await createOwnedRoom(slug, session.user.id, message, isDiary, iconIndex);
    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ error: "slug_taken" }, { status: 409 });
    }
    throw error;
  }
}
