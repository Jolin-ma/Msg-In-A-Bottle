import { prisma } from "@/lib/prisma";
import { sanitizeSlug } from "@/lib/slug";

// How many past replies replay as an already-settled letter pile when a
// bottle is opened. The single most recent one is still the only one shown
// as readable text; the rest are physics history bounded for client perf.
const PILE_HISTORY_LIMIT = 60;

// Room.slug must stay globally unique forever, even after its owner "deletes"
// it, because a replied-to bottle keeps its link alive for whoever holds it
// (see releaseRoomOwnership). So a bottle's display name can't just be its
// slug — this derives a free slug from the name, suffixing only on collision,
// so the name itself stays reusable across however many bottles someone
// creates and lets go of.
async function generateUniqueSlug(base: string): Promise<string> {
  const root = base || "bottle";
  let candidate = root;
  let suffix = 2;
  while (await prisma.room.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${root}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

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
  name: string,
  ownerId: string,
  initialMessage?: string | null,
  isDiary = false,
  iconIndex = 0,
) {
  const slug = await generateUniqueSlug(sanitizeSlug(name));
  const room = await prisma.room.create({
    data: { slug, name, ownerId, isDiary, iconIndex },
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
