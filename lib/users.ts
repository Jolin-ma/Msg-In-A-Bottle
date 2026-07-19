import { prisma } from "@/lib/prisma";

export async function getUserCount() {
  return prisma.user.count();
}

// JWT sessions outlive account deletion (the cookie stays valid for its full
// lifetime), so routes that write rows keyed to the user must confirm the
// row still exists or they 500 on the foreign key.
export async function userExists(id: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  return user !== null;
}
