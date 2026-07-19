// Fixed-window, in-memory, per-process rate limiting. Good enough for a
// single-instance soft launch; swap for a shared store (Redis/Upstash) if
// the app ever runs on more than one instance, since each instance counts
// independently.

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();

// Bound the map so a slow drip of unique keys (e.g. spoofed IPs) can't grow
// it forever: sweep expired windows whenever it gets large.
const SWEEP_THRESHOLD = 10_000;

function sweep(now: number) {
  for (const [key, window] of windows) {
    if (window.resetAt <= now) {
      windows.delete(key);
    }
  }
}

/** Returns true if the caller is within `limit` events per `windowMs`. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (windows.size >= SWEEP_THRESHOLD) {
    sweep(now);
  }

  const window = windows.get(key);
  if (!window || window.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  window.count += 1;
  return window.count <= limit;
}

// First hop of x-forwarded-for is the client as reported by the fronting
// proxy (Vercel/most hosts overwrite rather than append, so it's trustworthy
// there). Falls back to a shared bucket when the header is absent (local dev).
export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
