// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import {
  assertNonNegativeInteger,
  assertPositiveFinite,
  assertPositiveInteger,
} from "./_validation.ts";
import {
  createFixedWindowAlgorithm,
  createGcraAlgorithm,
  createSlidingWindowAlgorithm,
  createTokenBucketAlgorithm,
} from "./_keyed_algorithms.ts";
import type { KeyedAlgorithm } from "./_keyed_algorithms.ts";

/**
 * Options for {@linkcode createRateLimiter}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface RateLimiterOptions {
  /** Maximum permits per key per window/cycle. */
  limit: number;
  /** Window duration in milliseconds. */
  window: number;
  /**
   * Algorithm to use.
   *
   * - `"fixed-window"` — counter resets at each window boundary. Simplest.
   *   Allows boundary bursts up to 2× the limit.
   * - `"sliding-window"` — window divided into segments that rotate
   *   individually. Smoother enforcement, no boundary bursts.
   * - `"token-bucket"` — tokens refill at a steady rate. Best for smoothing
   *   bursty traffic with a configurable burst cap.
   * - `"gcra"` — Generic Cell Rate Algorithm. Enforces strict uniform
   *   spacing between requests with a single timestamp per key. Ideal when you
   *   want hard, even enforcement with no boundary effects and minimal memory.
   *
   * @default {"sliding-window"}
   */
  algorithm?: "fixed-window" | "sliding-window" | "token-bucket" | "gcra";
  /**
   * Number of segments for the sliding window algorithm. Higher values give
   * smoother enforcement at the cost of slightly more memory per key.
   * Ignored for other algorithms.
   *
   * @default {10}
   */
  segmentsPerWindow?: number;
  /**
   * For token bucket: tokens added per replenishment cycle. Ignored for
   * other algorithms.
   *
   * @default {limit}
   */
  tokensPerCycle?: number;
  /**
   * Time-to-live for idle key state in milliseconds. Keys with no activity
   * for this duration are eligible for eviction. Set to `0` to disable
   * automatic eviction.
   *
   * Only {@linkcode KeyedRateLimiter.limit} counts as activity for
   * eviction purposes. {@linkcode KeyedRateLimiter.peek} does not refresh
   * a key's last-access time.
   *
   * @default {300_000}
   */
  evictionTtl?: number;
  /**
   * How often to scan for and evict idle keys, in milliseconds. Only
   * meaningful when `evictionTtl > 0`.
   *
   * @default {60_000}
   */
  evictionInterval?: number;
  /**
   * Maximum number of keys to track. When the limit is reached, new keys
   * are rejected with `ok: false` (with `resetAt: 0` and `retryAfter: 0`).
   * Set to `0` to disable (unbounded).
   *
   * Note: this limits the number of keys, not total memory. Long key
   * strings still consume memory proportional to their length.
   *
   * @default {0}
   */
  maxKeys?: number;
  /**
   * Clock function returning the current time in milliseconds. Override
   * for testing with `FakeTime`.
   *
   * @default {Date.now}
   */
  clock?: () => number;
}

/**
 * Options for {@linkcode KeyedRateLimiter.limit}.
 *
 * @see {@linkcode PeekOptions} for the read-only equivalent.
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface LimitOptions {
  /**
   * Number of permits to consume for this request. Use higher values for
   * expensive operations.
   *
   * @default {1}
   */
  cost?: number;
}

/**
 * Options for {@linkcode KeyedRateLimiter.peek}.
 *
 * @see {@linkcode LimitOptions} for the consuming equivalent.
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface PeekOptions {
  /**
   * Number of permits to check. Determines whether a request of this size
   * would be allowed and computes `retryAfter` accordingly.
   *
   * @default {1}
   */
  cost?: number;
}

/**
 * The result of a rate limit check. All fields are present regardless of
 * whether the request was allowed.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface RateLimitResult {
  /** Whether the request is allowed. */
  readonly ok: boolean;
  /** Best-effort estimate of remaining permits for this key. */
  readonly remaining: number;
  /**
   * Timestamp (milliseconds since epoch) of the next replenishment event
   * (segment rotation, window boundary, or refill cycle). This is *not*
   * necessarily when full capacity is restored — for sliding-window and
   * token-bucket it may take multiple replenishment cycles. Useful for the
   * `X-RateLimit-Reset` HTTP header.
   */
  readonly resetAt: number;
  /**
   * Minimum retry delay in milliseconds. `0` when the request is allowed.
   * This is the earliest point at which capacity *may* free up. For
   * sliding-window, this reflects the next segment rotation and may not
   * free enough permits for a high-cost request. For token-bucket and GCRA
   * the value accounts for the requested cost. Useful for the
   * `Retry-After` HTTP header.
   */
  readonly retryAfter: number;
  /** The limit configured for this limiter. */
  readonly limit: number;
}

/**
 * A keyed rate limiter that manages per-key state internally. This is the
 * primary rate limiting API for the common case of "allow key X at most N
 * requests per window."
 *
 * **Disposal behavior:** after disposal, `limit()` and `peek()` return a
 * result with `ok: false` (remaining/resetAt/retryAfter all `0`), and
 * `reset()` is a no-op. This matches the primitive limiter contract where
 * `tryAcquire()` returns a rejected lease after disposal.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface KeyedRateLimiter extends Disposable {
  /**
   * Check whether a request for the given key should be allowed, and
   * consume permits if so.
   *
   * @param key Identifier for the rate limit subject (user ID, IP, etc.).
   * @param options Override cost per request.
   * @returns A {@linkcode RateLimitResult} with the decision and metadata.
   */
  limit(key: string, options?: LimitOptions): RateLimitResult;

  /**
   * Check the current state for a key without consuming any permits.
   * Useful for displaying remaining quota in UI or headers without
   * affecting the count.
   *
   * Note: `peek()` does not count as activity for TTL-based eviction.
   * Keys that are only peeked (never limited) will still be evicted after
   * `evictionTtl` of inactivity.
   */
  peek(key: string, options?: PeekOptions): RateLimitResult;

  /**
   * Reset all state for a key, restoring it to full capacity. Useful for
   * testing, admin overrides, or support tooling.
   */
  reset(key: string): void;

  /** Number of keys currently tracked. */
  readonly size: number;
}

/**
 * Create a keyed rate limiter. The algorithm and its parameters are
 * configured once; per-key state is managed internally with automatic
 * eviction of idle keys.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Basic API rate limiting
 * ```ts no-eval
 * import { createRateLimiter } from "@std/rate-limit/rate-limiter";
 *
 * using limiter = createRateLimiter({ limit: 100, window: 60_000 });
 *
 * Deno.serve((req) => {
 *   const ip = req.headers.get("x-forwarded-for") ?? "unknown";
 *   const result = limiter.limit(ip);
 *   if (!result.ok) {
 *     return new Response("Too many requests", {
 *       status: 429,
 *       headers: {
 *         "Retry-After": String(Math.ceil(result.retryAfter / 1000)),
 *       },
 *     });
 *   }
 *   return new Response("OK");
 * });
 * ```
 *
 * @example Variable cost
 * ```ts no-assert
 * import { createRateLimiter } from "@std/rate-limit/rate-limiter";
 *
 * using limiter = createRateLimiter({ limit: 100, window: 60_000 });
 * const result = limiter.limit("user:123", { cost: 5 });
 * ```
 *
 * @example GCRA for strict uniform spacing
 * ```ts no-assert
 * import { createRateLimiter } from "@std/rate-limit/rate-limiter";
 *
 * using limiter = createRateLimiter({
 *   limit: 10,
 *   window: 1_000,
 *   algorithm: "gcra",
 * });
 *
 * const result = limiter.limit("user:123");
 * if (!result.ok) {
 *   console.log(`Retry after ${result.retryAfter}ms`);
 * }
 * ```
 *
 * @param options Configuration for the rate limiter.
 * @returns A {@linkcode KeyedRateLimiter}.
 */
export function createRateLimiter(
  options: RateLimiterOptions,
): KeyedRateLimiter {
  const context = "rate limiter";
  assertPositiveInteger(context, "limit", options.limit);
  assertPositiveFinite(context, "window", options.window);

  const {
    limit,
    window: windowMs,
    algorithm: algorithmName = "sliding-window",
    segmentsPerWindow = 10,
    tokensPerCycle = limit,
    evictionTtl = 300_000,
    evictionInterval = 60_000,
    maxKeys = 0,
    clock = Date.now,
  } = options;

  if (algorithmName === "token-bucket") {
    assertPositiveInteger(context, "tokensPerCycle", tokensPerCycle);
    if (tokensPerCycle > limit) {
      throw new RangeError(
        `Cannot create ${context}: 'tokensPerCycle' (${tokensPerCycle}) exceeds 'limit' (${limit})`,
      );
    }
  }

  if (!Number.isFinite(evictionTtl) || evictionTtl < 0) {
    throw new RangeError(
      `Cannot create ${context}: 'evictionTtl' must be a non-negative finite number, received ${evictionTtl}`,
    );
  }

  if (evictionTtl > 0) {
    assertPositiveFinite(context, "evictionInterval", evictionInterval);
  }

  assertNonNegativeInteger(context, "maxKeys", maxKeys);

  let algorithm: KeyedAlgorithm;
  switch (algorithmName) {
    case "fixed-window":
      algorithm = createFixedWindowAlgorithm(limit, windowMs);
      break;
    case "sliding-window":
      algorithm = createSlidingWindowAlgorithm(
        limit,
        windowMs,
        segmentsPerWindow,
      );
      break;
    case "token-bucket":
      algorithm = createTokenBucketAlgorithm(limit, windowMs, tokensPerCycle);
      break;
    case "gcra":
      algorithm = createGcraAlgorithm(limit, windowMs);
      break;
    default:
      throw new TypeError(
        `Cannot create ${context}: unknown algorithm '${algorithmName as string}'`,
      );
  }

  const MAX_KEYS_REJECTED: RateLimitResult = Object.freeze({
    ok: false as const,
    remaining: 0,
    resetAt: 0,
    retryAfter: 0,
    limit,
  });

  const DISPOSED_RESULT: RateLimitResult = Object.freeze({
    ok: false as const,
    remaining: 0,
    resetAt: 0,
    retryAfter: 0,
    limit,
  });

  let disposed = false;
  let evictionTimer: ReturnType<typeof setInterval> | undefined;

  if (evictionTtl > 0) {
    evictionTimer = setInterval(
      () => algorithm.evict(clock(), evictionTtl),
      evictionInterval,
    );
  }

  function validateCost(method: string, cost: number): void {
    if (!Number.isInteger(cost) || cost < 1) {
      throw new RangeError(
        `Cannot ${method}: 'cost' must be a positive integer, received ${cost}`,
      );
    }
    if (cost > limit) {
      throw new RangeError(
        `Cannot ${method}: 'cost' (${cost}) exceeds the limit (${limit})`,
      );
    }
  }

  return {
    limit(key: string, options?: LimitOptions): RateLimitResult {
      if (disposed) return DISPOSED_RESULT;
      const cost = options?.cost ?? 1;
      validateCost("limit", cost);
      if (maxKeys > 0 && algorithm.size >= maxKeys && !algorithm.has(key)) {
        return MAX_KEYS_REJECTED;
      }
      return algorithm.limit(key, cost, clock());
    },
    peek(key: string, options?: PeekOptions): RateLimitResult {
      if (disposed) return DISPOSED_RESULT;
      const cost = options?.cost ?? 1;
      validateCost("peek", cost);
      if (maxKeys > 0 && algorithm.size >= maxKeys && !algorithm.has(key)) {
        return MAX_KEYS_REJECTED;
      }
      return algorithm.peek(key, cost, clock());
    },
    reset(_key: string): void {
      if (disposed) return;
      algorithm.reset(_key);
    },
    get size(): number {
      return algorithm.size;
    },
    [Symbol.dispose](): void {
      if (disposed) return;
      disposed = true;
      if (evictionTimer !== undefined) {
        clearInterval(evictionTimer);
        evictionTimer = undefined;
      }
      algorithm.clear();
    },
  };
}
