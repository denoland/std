// Copyright 2018-2026 the Deno authors. MIT license.

import type { QueueOptions, ReplenishingRateLimiter } from "./types.ts";
import { createReplenishingLimiter } from "./_replenishing_limiter.ts";
import { createFixedWindowOps } from "./_algorithms.ts";
import {
  assertNonNegativeInteger,
  assertPositiveFinite,
  assertPositiveInteger,
} from "./_validation.ts";

/**
 * Options for {@linkcode createFixedWindow}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface FixedWindowOptions extends QueueOptions {
  /** Maximum permits per window. */
  limit: number;
  /** Window duration in milliseconds. */
  window: number;
  /**
   * Start an internal timer for automatic window rotation.
   *
   * When `false`, call {@linkcode ReplenishingRateLimiter.replenish}
   * manually.
   *
   * @default {true}
   */
  autoReplenishment?: boolean;
  /**
   * Clock function returning the current time in milliseconds. Override
   * for deterministic testing.
   *
   * @default {Date.now}
   */
  clock?: () => number;
}

/**
 * Create a fixed window rate limiter. A counter resets at the start of each
 * window, making this the simplest time-windowed strategy — ideal for HTTP
 * servers and 429 response logic.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Basic usage
 * ```ts
 * import { createFixedWindow } from "@std/rate-limit/fixed-window";
 * import { assert } from "@std/assert";
 *
 * using limiter = createFixedWindow({
 *   limit: 100,
 *   window: 60_000,
 * });
 *
 * using lease = limiter.tryAcquire();
 * assert(lease.acquired);
 * ```
 *
 * @example Manual replenishment
 * ```ts no-assert
 * import { createFixedWindow } from "@std/rate-limit/fixed-window";
 *
 * using limiter = createFixedWindow({
 *   limit: 100,
 *   window: 60_000,
 *   autoReplenishment: false,
 * });
 *
 * limiter.replenish();
 * ```
 *
 * @param options Configuration for the fixed window.
 * @returns A {@linkcode ReplenishingRateLimiter}.
 */
export function createFixedWindow(
  options: FixedWindowOptions,
): ReplenishingRateLimiter {
  const context = "fixed window";
  assertPositiveInteger(context, "limit", options.limit);
  assertPositiveFinite(context, "window", options.window);
  assertNonNegativeInteger(context, "queueLimit", options.queueLimit);

  const { limit, window: windowMs } = options;
  const clock = options.clock ?? Date.now;
  const ops = createFixedWindowOps(limit, windowMs);
  const state = ops.create(clock());
  let lastNow = 0;

  return createReplenishingLimiter(
    {
      replenishmentPeriod: windowMs,
      autoReplenishment: options.autoReplenishment ?? true,
      queueLimit: options.queueLimit ?? 0,
      queueOrder: options.queueOrder ?? "oldest-first",
    },
    {
      get permitLimit() {
        return ops.limit;
      },
      tryAcquirePermits(permits: number): boolean {
        lastNow = clock();
        ops.advance(state, lastNow);
        return ops.tryConsume(state, permits, lastNow);
      },
      replenish(): void {
        lastNow = state.windowStart + windowMs;
        ops.advance(state, lastNow);
      },
      computeRetryAfter(permits: number): number {
        return ops.computeRetryAfter(state, permits, lastNow);
      },
    },
  );
}
