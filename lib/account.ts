import { prisma } from "@/lib/prisma";

// Diary entries cascade-delete with the user (schema: onDelete: Cascade).
// Owned bottles/feedback just lose their owner link (onDelete: SetNull) —
// matches the existing "release a bottle" semantics: a bottle already
// replied to is a two-way exchange, so it stays live for whoever has the
// link rather than being destroyed along with the account.
export async function deleteUserAccount(userId: string) {
  await prisma.user.delete({ where: { id: userId } });
}

// Same content-clearing rule as deleting the account, minus deleting the
// account itself: the user stays signed in with an empty dashboard. Diary
// entries are gone outright; owned bottles follow the same delete-vs-release
// split as removing a single bottle does (lib/rooms.ts) — empty ones are
// hard-deleted, replied-to ones just lose their owner so the link stays
// live for whoever has it.
export async function wipeUserData(userId: string) {
  await prisma.diaryEntry.deleteMany({ where: { userId } });

  const rooms = await prisma.room.findMany({
    where: { ownerId: userId },
    include: { _count: { select: { messages: true } } },
  });

  const emptyRoomIds = rooms.filter((room) => room._count.messages === 0).map((room) => room.id);
  const repliedRoomIds = rooms.filter((room) => room._count.messages > 0).map((room) => room.id);

  if (emptyRoomIds.length > 0) {
    await prisma.room.deleteMany({ where: { id: { in: emptyRoomIds } } });
  }
  if (repliedRoomIds.length > 0) {
    await prisma.room.updateMany({
      where: { id: { in: repliedRoomIds } },
      data: { ownerId: null },
    });
  }
}
