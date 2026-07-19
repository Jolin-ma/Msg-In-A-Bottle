import { prisma } from "@/lib/prisma";

// How many past replies replay as an already-settled letter pile when a
// bottle is opened. The single most recent one is still the only one shown
// as readable text; the rest are physics history bounded for client perf.
const PILE_HISTORY_LIMIT = 60;

export async function getOrCreateRoom(slug: string) {
  return prisma.room.upsert({
    where: { slug },
    update: {},
    create: { slug },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: PILE_HISTORY_LIMIT },
      owner: { select: { name: true, email: true } },
    },
  });
}

export async function createOwnedRoom(
  slug: string,
  ownerId: string,
  initialMessage?: string | null,
  isDiary = false,
  iconIndex = 0,
) {
  const room = await prisma.room.create({
    data: { slug, ownerId, isDiary, iconIndex },
  });

  if (initialMessage) {
    await prisma.message.create({
      data: { text: initialMessage, roomId: room.id },
    });
  }

  return room;
}

export async function getRoomsByOwner(ownerId: string) {
  return prisma.room.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: true } },
    },
  });
}

export async function markRoomRead(roomId: string) {
  await prisma.room.update({
    where: { id: roomId },
    data: { lastReadAt: new Date() },
  });
}

export async function getOwnedRoomWithMessageCount(slug: string, ownerId: string) {
  return prisma.room.findFirst({
    where: { slug, ownerId },
    include: { _count: { select: { messages: true } } },
  });
}

// A bottle only its owner has ever touched (no reply yet) can be deleted
// outright. Once a reply exists it's a two-way exchange, so the owner can
// only let go of it — release ownership rather than destroy the other
// person's message.
export async function deleteEmptyRoom(roomId: string) {
  await prisma.room.delete({ where: { id: roomId } });
}

export async function releaseRoomOwnership(roomId: string) {
  await prisma.room.update({
    where: { id: roomId },
    data: { ownerId: null },
  });
}
