import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  deleteEmptyRoom,
  getOrCreateRoom,
  getOwnedRoomWithMessageCount,
  releaseRoomOwnership,
} from "@/lib/rooms";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const room = await getOrCreateRoom(slug);
  return NextResponse.json(room);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const room = await getOwnedRoomWithMessageCount(slug, session.user.id);
  if (!room) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (room._count.messages === 0) {
    await deleteEmptyRoom(room.id);
    return NextResponse.json({ status: "deleted" });
  }

  await releaseRoomOwnership(room.id);
  return NextResponse.json({ status: "released" });
}
