/**
 * Lightweight, in-memory sliding-window rate limiter for Next.js API routes.
 * Designed for serverless/single-instance containers (e.g. Fly.io).
 */

interface RateLimitRecord {
  timestamps: number[];
}

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

const cache = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function performCleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, record] of cache.entries()) {
    // Keep only timestamps within the last 10 minutes
    const validTimestamps = record.timestamps.filter((ts) => now - ts < 10 * 60 * 1000);
    if (validTimestamps.length === 0) {
      cache.delete(key);
    } else {
      record.timestamps = validTimestamps;
    }
  }
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds
}

/**
 * Checks and records a request against the rate limit.
 *
 * @param key Unique key for the rate limit target (e.g. "order-create:127.0.0.1")
 * @param config { limit, windowMs }
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  // In test environment, allow bypassing if explicitly disabled
  if (process.env.DISABLE_RATE_LIMIT === "true") {
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit,
      reset: Math.floor((Date.now() + config.windowMs) / 1000),
    };
  }

  performCleanup();

  const now = Date.now();
  const windowStart = now - config.windowMs;

  const record = cache.get(key) || { timestamps: [] };
  const recentTimestamps = record.timestamps.filter((ts) => ts > windowStart);

  const resetTimeSeconds = Math.ceil((recentTimestamps[0] ? recentTimestamps[0] + config.windowMs : now + config.windowMs) / 1000);

  if (recentTimestamps.length >= config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      reset: resetTimeSeconds,
    };
  }

  recentTimestamps.push(now);
  cache.set(key, { timestamps: recentTimestamps });

  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - recentTimestamps.length,
    reset: resetTimeSeconds,
  };
}

/**
 * Clears the in-memory rate limit store (used in test suites).
 */
export function resetRateLimitStore(): void {
  cache.clear();
}

/**
 * Extracts client IP from standard proxy headers.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",");
    return parts[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}
