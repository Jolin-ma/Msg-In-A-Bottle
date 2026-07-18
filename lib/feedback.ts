import { prisma } from "@/lib/prisma";
import type { FeedbackStatus, FeedbackCategory } from "@/app/generated/prisma/client";

const MAX_TEXT_LENGTH = 1000;

export function isValidFeedbackText(text: unknown): text is string {
  return typeof text === "string" && text.trim().length > 0 && text.length <= MAX_TEXT_LENGTH;
}

export async function createFeedback(
  text: string,
  contactEmail: string | null,
  userId: string | null,
) {
  return prisma.feedback.create({
    data: { text, contactEmail, userId },
  });
}

export async function getUnreadFeedbackCount() {
  return prisma.feedback.count({ where: { status: "NEW" } });
}

export async function getAllFeedback() {
  return prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true } } },
  });
}

export interface FeedbackUpdate {
  status?: FeedbackStatus;
  category?: FeedbackCategory;
  archived?: boolean;
  reply?: string;
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
      ...(update.reply !== undefined
        ? { adminReply: update.reply, adminReplyAt: new Date(), replyReadAt: null }
        : {}),
    },
  });
}

// Every piece of feedback a user has sent, newest first — powers the
// "get in touch" modal's reply thread and its unread red dot.
export async function getFeedbackForUser(userId: string) {
  return prisma.feedback.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function markFeedbackReplyRead(id: string, userId: string) {
  await prisma.feedback.updateMany({
    where: { id, userId },
    data: { replyReadAt: new Date() },
  });
}

export async function deleteFeedback(id: string) {
  await prisma.feedback.delete({ where: { id } });
}
