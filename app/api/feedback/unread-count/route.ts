import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { getUnreadFeedbackCount } from "@/lib/feedback";

// Lets a local background poller (no browser session) check for new
// feedback — e.g. to fire a desktop notification — via a shared secret
// instead of a full admin login.
function hasValidApiKey(request: Request): boolean {
  const key = process.env.ADMIN_API_KEY;
  const provided = request.headers.get("x-admin-key");
  if (!key || !provided) return false;
  const keyBuffer = Buffer.from(key);
  const providedBuffer = Buffer.from(provided);
  return (
    keyBuffer.length === providedBuffer.length &&
    timingSafeEqual(keyBuffer, providedBuffer)
  );
}

export async function GET(request: Request) {
  if (!hasValidApiKey(request)) {
    const session = await auth();
    if (!isAdminEmail(session?.user?.email)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  const count = await getUnreadFeedbackCount();
  return NextResponse.json({ count });
}
