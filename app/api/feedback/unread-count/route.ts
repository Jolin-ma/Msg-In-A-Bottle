import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { getUnreadFeedbackCount } from "@/lib/feedback";

// Lets a local background poller (no browser session) check for new
// feedback — e.g. to fire a desktop notification — via a shared secret
// instead of a full admin login.
function hasValidApiKey(request: Request): boolean {
  const key = process.env.ADMIN_API_KEY;
  if (!key) return false;
  return request.headers.get("x-admin-key") === key;
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
