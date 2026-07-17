import { prisma } from "@/lib/prisma";

export async function getOrCreateRoom(slug: string) {
  return prisma.room.upsert({
    where: { slug },
    update: {},
    create: { slug, isPublic: true },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      owner: { select: { name: true, email: true } },
    },
  });
}

export async function createOwnedRoom(
  slug: string,
  ownerId: string,
  name?: string | null,
  isPublic = true,
) {
  return prisma.room.create({
    data: { slug, ownerId, isPublic, name: name || null },
  });
}

export async function getRoomsByOwner(ownerId: string) {
  return prisma.room.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
    include: { messages: { orderBy: { createdAt: "desc" } } },
  });
}

export async function getRandomPublicRoom() {
  const count = await prisma.room.count({ where: { isPublic: true } });
  if (count === 0) return null;

  const offset = Math.floor(Math.random() * count);
  const [room] = await prisma.room.findMany({
    where: { isPublic: true },
    skip: offset,
    take: 1,
    select: { slug: true },
  });
  return room ?? null;
}
