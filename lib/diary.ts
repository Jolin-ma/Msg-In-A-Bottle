import { prisma } from "@/lib/prisma";

const MAX_TEXT_LENGTH = 500;

export function isValidDiaryText(text: unknown): text is string {
  return typeof text === "string" && text.trim().length > 0 && text.length <= MAX_TEXT_LENGTH;
}

export async function getDiaryEntries(userId: string) {
  return prisma.diaryEntry.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

export async function createDiaryEntry(userId: string, text: string) {
  return prisma.diaryEntry.create({
    data: { userId, text },
  });
}
