import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { wipeUserData } from "@/lib/account";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await wipeUserData(session.user.id);
  return NextResponse.json({ status: "wiped" });
}
