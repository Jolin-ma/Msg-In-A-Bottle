import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteUserAccount } from "@/lib/account";

export async function DELETE() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await deleteUserAccount(session.user.id);
  return NextResponse.json({ status: "deleted" });
}
