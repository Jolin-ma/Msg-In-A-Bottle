import { prisma } from "@/lib/prisma";
import type { FeedbackStatus, FeedbackCategory } from "@/app/generated/prisma/client";

const MAX_TEXT_LENGTH = 1000;

export function isValidFeedbackText(text: unknown): text is string {
  return typeof text === "string" && text.trim().length > 0 && text.length <= MAX_TEXT_LENGTH;
}

export async function createFeedback(text: string, contactEmail: string | null) {
  return prisma.feedback.create({
    data: { text, contactEmail },
  });
}

export async function getAllFeedback() {
  return prisma.feedback.findMany({ orderBy: { createdAt: "desc" } });
}

export interface FeedbackUpdate {
  status?: FeedbackStatus;
  category?: FeedbackCategory;
  archived?: boolean;
}

export async function updateFeedback(id: string, update: FeedbackUpdate) {
  return prisma.feedback.update({
    where: { id },
    data: {
      ...(update.status !== undefined ? { status: update.status } : {}),
      ...(update.category !== undefined ? { category: update.category } : {}),
      ...(update.archived !== undefined
        ? { archivedAt: update.archived ? new Date() : null }
        : {}),
    },
  });
}
