import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { BOTTLE_ICONS } from "@/lib/bottleIcons";
import { createOwnedRoom } from "@/lib/rooms";
import { sanitizeSlug } from "@/lib/slug";

const MAX_MESSAGE_LENGTH = 500;
const MAX_NAME_LENGTH = 100;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const rawName: unknown = body?.slug;
  const rawMessage: unknown = body?.message;
  const rawIsDiary: unknown = body?.isDiary;
  const rawIconIndex: unknown = body?.iconIndex;
  if (
    typeof rawName !== "string" ||
    rawName.length > MAX_NAME_LENGTH ||
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
    return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  }

  const name = rawName.trim();
  if (!name || !sanitizeSlug(name)) {
    return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  }

  const message = typeof rawMessage === "string" ? rawMessage.trim() : null;
  const isDiary = typeof rawIsDiary === "boolean" ? rawIsDiary : false;
  const iconIndex = typeof rawIconIndex === "number" ? rawIconIndex : 0;

  const room = await createOwnedRoom(name, session.user.id, message, isDiary, iconIndex);
  return NextResponse.json(room, { status: 201 });
}
