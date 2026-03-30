// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import type { MemoryStoreOptions } from "./memory_store.ts";
import { createMemoryStore } from "./memory_store.ts";
import type { RateLimitStore } from "./store_types.ts";

/**
 * Options for {@linkcode KeyedRateLimiter.limit} and
 * {@linkcode KeyedRateLimiter.peek}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Variable cost per request
 * ```ts
 * import { createRateLimiter } from "@std/rate-limit/rate-limiter";
 * import { assert } from "@std/assert";
 *
 * await using limiter = createRateLimiter({ limit: 100, window: 60_000 });
 *
 * const result = await limiter.limit("user:123", { cost: 5 });
 * assert(result.ok);
 * ```
 */
export interface CostOptions {
  /**
   * Number of permits to consume (for `limit`) or check (for `peek`).
   * Use higher values for expensive operations.
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
   * token-bucket it may take multiple replenishment cycles. For GCRA this
   * is the theoretical arrival time (TAT) at which full burst capacity is
   * restored. Useful for the `X-RateLimit-Reset` HTTP header.
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
 * All methods are async to support pluggable store backends (in-memory,
 * Redis, Deno KV). For in-memory stores the returned promises resolve
 * synchronously.
 *
 * **Disposal behavior:** after disposal, `limit()` and `peek()` return a
 * result with `ok: false` (remaining/resetAt/retryAfter all `0`), and
 * `reset()` is a no-op.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface KeyedRateLimiter extends AsyncDisposable {
  /**
   * Check whether a request for the given key should be allowed, and
   * consume permits if so.
   *
   * @param key Identifier for the rate limit subject (user ID, IP, etc.).
   * @param options Override cost per request.
   * @returns A {@linkcode RateLimitResult} with the decision and metadata.
   */
  limit(key: string, options?: CostOptions): Promise<RateLimitResult>;

  /**
   * Check the current state for a key without consuming any permits.
   * Useful for displaying remaining quota in UI or headers without
   * affecting the count.
   */
  peek(key: string, options?: CostOptions): Promise<RateLimitResult>;

  /**
   * Reset all state for a key, restoring it to full capacity.
   */
  reset(key: string): Promise<void>;
}

/**
 * Options when using the default in-memory store. Extends
 * {@linkcode MemoryStoreOptions} with a `store?: undefined` discriminant.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export type MemoryRateLimiterOptions = MemoryStoreOptions & {
  store?: undefined;
};

/**
 * Options when providing a custom {@linkcode RateLimitStore} backend.
 * Memory-store options (`limit`, `window`, etc.) are typed as `never`
 * to prevent accidentally passing them alongside a custom store, since
 * the store owns those settings.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface StoreRateLimiterOptions {
  /** The store backend to delegate to. */
  store: RateLimitStore;
  limit?: never;
  window?: never;
  algorithm?: never;
  segmentsPerWindow?: never;
  tokensPerPeriod?: never;
  evictionTtl?: never;
  evictionInterval?: never;
  maxKeys?: never;
  clock?: never;
}

/**
 * Options for {@linkcode createRateLimiter}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export type RateLimiterOptions =
  | MemoryRateLimiterOptions
  | StoreRateLimiterOptions;

/**
 * Create a keyed rate limiter backed by an in-memory store or a custom
 * {@linkcode RateLimitStore}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Basic usage
 * ```ts
 * import { createRateLimiter } from "@std/rate-limit/rate-limiter";
 * import { assert, assertEquals } from "@std/assert";
 *
 * await using limiter = createRateLimiter({ limit: 100, window: 60_000 });
 * const result = await limiter.limit("user:123", { cost: 5 });
 * assert(result.ok);
 * assertEquals(result.remaining, 95);
 * ```
 *
 * @example Custom store backend
 * ```ts ignore
 * import { createRateLimiter } from "@std/rate-limit/rate-limiter";
 * import { createRedisStore } from "@std/rate-limit/redis-store";
 *
 * const store = createRedisStore({
 *   redis: myRedisClient,
 *   algorithm: "sliding-window",
 *   limit: 100,
 *   window: 60_000,
 * });
 *
 * await using limiter = createRateLimiter({ store });
 * ```
 *
 * @param options Configuration for the rate limiter.
 * @returns A {@linkcode KeyedRateLimiter}.
 */
export function createRateLimiter(
  options: RateLimiterOptions,
): KeyedRateLimiter {
  const store: RateLimitStore = options.store ??
    createMemoryStore(options as MemoryRateLimiterOptions);

  const limit = store.capacity;

  const DISPOSED_RESULT: RateLimitResult = Object.freeze({
    ok: false as const,
    remaining: 0,
    resetAt: 0,
    retryAfter: 0,
    limit,
  });

  let disposed = false;

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
    limit(key: string, options?: CostOptions): Promise<RateLimitResult> {
      if (disposed) return Promise.resolve(DISPOSED_RESULT);
      const cost = options?.cost ?? 1;
      validateCost("limit", cost);
      return store.consume(key, cost);
    },
    peek(key: string, options?: CostOptions): Promise<RateLimitResult> {
      if (disposed) return Promise.resolve(DISPOSED_RESULT);
      const cost = options?.cost ?? 1;
      validateCost("peek", cost);
      return store.peek(key, cost);
    },
    reset(key: string): Promise<void> {
      if (disposed) return Promise.resolve();
      return store.reset(key);
    },
    async [Symbol.asyncDispose](): Promise<void> {
      if (disposed) return;
      disposed = true;
      await store[Symbol.asyncDispose]();
    },
  };
}
