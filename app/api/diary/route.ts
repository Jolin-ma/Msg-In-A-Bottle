import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createDiaryEntry, isValidDiaryText } from "@/lib/diary";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const text: unknown = body?.text;

  if (!isValidDiaryText(text)) {
    return NextResponse.json({ error: "invalid_text" }, { status: 400 });
  }

  const entry = await createDiaryEntry(session.user.id, text.trim());
  return NextResponse.json(entry, { status: 201 });
}
