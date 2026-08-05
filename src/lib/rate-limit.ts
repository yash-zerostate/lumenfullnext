/**
 * Fixed-window limiter kept in process memory. Good enough for a single-instance
 * demo; a multi-instance deployment would swap the Map for Redis and keep the
 * same call signature.
 */
type Bucket = { count: number; resetAt: number };

const globalForLimiter = globalThis as unknown as { _rateBuckets?: Map<string, Bucket> };
const buckets: Map<string, Bucket> =
  globalForLimiter._rateBuckets ?? (globalForLimiter._rateBuckets = new Map());

export type RateLimitResult = { allowed: boolean; remaining: number; retryAfterSeconds: number };

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

  if (existing.count > limit) {
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }
  return { allowed: true, remaining: limit - existing.count, retryAfterSeconds };
}

/** Best-effort client IP behind a proxy/CDN. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
