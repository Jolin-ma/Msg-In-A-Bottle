import { prisma } from "@/lib/prisma";

// Diary entries cascade-delete with the user (schema: onDelete: Cascade).
// Owned bottles/feedback just lose their owner link (onDelete: SetNull) —
// matches the existing "release a bottle" semantics: a bottle already
// replied to is a two-way exchange, so it stays live for whoever has the
// link rather than being destroyed along with the account.
export async function deleteUserAccount(userId: string) {
  await prisma.user.delete({ where: { id: userId } });
}
