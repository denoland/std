// Copyright 2018-2026 the Deno authors. MIT license.

import type { QueueOptions, ReplenishingRateLimiter } from "./types.ts";
import { createReplenishingLimiter } from "./_replenishing_limiter.ts";
import { createSlidingWindowOps } from "./_algorithms.ts";
import {
  assertNonNegativeInteger,
  assertPositiveFinite,
  assertPositiveInteger,
} from "./_validation.ts";

/**
 * Options for {@linkcode createSlidingWindow}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface SlidingWindowOptions extends QueueOptions {
  /** Maximum permits across the sliding window. */
  limit: number;
  /** Total window duration in milliseconds. */
  window: number;
  /**
   * Number of segments within the window. Higher values give smoother rate
   * enforcement at the cost of more frequent timer ticks. Must be at least 2
   * (1 segment degenerates to a fixed window).
   */
  segmentsPerWindow: number;
  /**
   * Start an internal timer for automatic segment rotation.
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
 * Create a sliding window rate limiter. The window is divided into segments
 * that rotate individually, giving smoother rate enforcement than a fixed
 * window. Unlike a fixed window, a burst at the boundary cannot exceed the
 * permit limit.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Basic usage
 * ```ts
 * import { createSlidingWindow } from "@std/rate-limit/sliding-window";
 * import { assert } from "@std/assert";
 *
 * using limiter = createSlidingWindow({
 *   limit: 100,
 *   window: 60_000,
 *   segmentsPerWindow: 6,
 * });
 *
 * using lease = limiter.tryAcquire();
 * assert(lease.acquired);
 * ```
 *
 * @example Manual replenishment
 * ```ts no-assert
 * import { createSlidingWindow } from "@std/rate-limit/sliding-window";
 *
 * using limiter = createSlidingWindow({
 *   limit: 100,
 *   window: 60_000,
 *   segmentsPerWindow: 6,
 *   autoReplenishment: false,
 * });
 *
 * limiter.replenish();
 * ```
 *
 * @param options Configuration for the sliding window.
 * @returns A {@linkcode ReplenishingRateLimiter}.
 */
export function createSlidingWindow(
  options: SlidingWindowOptions,
): ReplenishingRateLimiter {
  const context = "sliding window";
  assertPositiveInteger(context, "limit", options.limit);
  assertPositiveFinite(context, "window", options.window);
  if (
    !Number.isInteger(options.segmentsPerWindow) ||
    options.segmentsPerWindow < 2
  ) {
    throw new RangeError(
      `Cannot create sliding window: 'segmentsPerWindow' must be an integer >= 2, received ${options.segmentsPerWindow}`,
    );
  }
  if (options.window % options.segmentsPerWindow !== 0) {
    throw new RangeError(
      `Cannot create sliding window: 'window' (${options.window}) must be evenly divisible by 'segmentsPerWindow' (${options.segmentsPerWindow})`,
    );
  }
  assertNonNegativeInteger(context, "queueLimit", options.queueLimit);

  const { limit, segmentsPerWindow, window } = options;
  const clock = options.clock ?? Date.now;
  const segmentDuration = window / segmentsPerWindow;
  const ops = createSlidingWindowOps(limit, window, segmentsPerWindow);
  const state = ops.create(clock());
  let lastNow = 0;

  return createReplenishingLimiter(
    {
      replenishmentPeriod: segmentDuration,
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
        lastNow = state.segmentStart + segmentDuration;
        ops.advance(state, lastNow);
      },
      computeRetryAfter(permits: number): number {
        return ops.computeRetryAfter(state, permits, lastNow);
      },
    },
  );
}
