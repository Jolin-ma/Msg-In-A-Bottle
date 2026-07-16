import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createOwnedRoom } from "@/lib/rooms";
import { sanitizeSlug } from "@/lib/slug";
import { Prisma } from "@/app/generated/prisma/client";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const rawSlug: unknown = body?.slug;
  const rawName: unknown = body?.name;
  if (
    typeof rawSlug !== "string" ||
    (rawName !== undefined && typeof rawName !== "string")
  ) {
    return NextResponse.json({ error: "invalid_slug" }, { status: 400 });
  }

  const slug = sanitizeSlug(rawSlug);
  if (!slug) {
    return NextResponse.json({ error: "invalid_slug" }, { status: 400 });
  }

  const name = typeof rawName === "string" ? rawName.trim().slice(0, 140) : null;

  try {
    const room = await createOwnedRoom(slug, session.user.id, name);
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
