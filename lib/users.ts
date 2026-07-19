import { prisma } from "@/lib/prisma";

export async function getUserCount() {
  return prisma.user.count();
}
