import { customAlphabet } from "nanoid";
import { prisma } from "@/lib/prisma";
import { sanitizeSlug } from "@/lib/slug";

// How many past replies replay as an already-settled letter pile when a
// bottle is opened. The single most recent one is still the only one shown
// as readable text; the rest are physics history bounded for client perf.
const PILE_HISTORY_LIMIT = 60;

// The slug is the only thing protecting a bottle ("sealed just for whoever
// has the link"), so it has to be an unguessable capability, not just the
// human-chosen name: name + random suffix. Alphabet restricted to the slug
// charset (lowercase alphanumerics). 36^8 ≈ 2.8e12 — plenty for links while
// staying short enough to read aloud.
const randomSlugSuffix = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8);

// Room.slug must stay globally unique forever, even after its owner "deletes"
// it, because a replied-to bottle keeps its link alive for whoever holds it
// (see releaseRoomOwnership). The random suffix makes collisions effectively
// impossible, but retry on one anyway rather than ever failing creation.
async function generateUniqueSlug(base: string): Promise<string> {
  const root = base || "bottle";
  let candidate = `${root}-${randomSlugSuffix()}`;
  while (await prisma.room.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${root}-${randomSlugSuffix()}`;
  }
  return candidate;
}

// Lookup only — rooms are created exclusively through createOwnedRoom
// (POST /api/bottles). Visiting an unknown slug must NOT mint a row:
// otherwise every crawler probe pollutes the DB and a typo'd link silently
// swallows a visitor's reply into a room nobody owns.
// Deliberately excludes owner.email: everything this returns is shown to
// whoever holds the link.
export async function getRoomBySlug(slug: string) {
  return prisma.room.findUnique({
    where: { slug },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: PILE_HISTORY_LIMIT },
      owner: { select: { name: true } },
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

// Set by a non-owner visitor who wants an email when the owner replies.
// Anyone holding the link can call this, same trust model as posting a
// message — no identity check beyond "not a diary" (diary has no visitors).
export async function setVisitorEmail(roomId: string, email: string) {
  await prisma.room.update({
    where: { id: roomId },
    data: { visitorEmail: email },
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
