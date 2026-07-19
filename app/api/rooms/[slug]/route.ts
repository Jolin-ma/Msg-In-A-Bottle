import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  deleteEmptyRoom,
  getOwnedRoomWithMessageCount,
  releaseRoomOwnership,
} from "@/lib/rooms";

// No GET here on purpose: the room page fetches its own data server-side,
// and a public JSON endpoint for arbitrary slugs previously leaked the
// owner's email and let unauthenticated visits create rooms.

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
