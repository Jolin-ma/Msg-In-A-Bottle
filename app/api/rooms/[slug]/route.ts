import { NextResponse } from "next/server";
import { getOrCreateRoom } from "@/lib/rooms";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const room = await getOrCreateRoom(slug);
  return NextResponse.json(room);
}
