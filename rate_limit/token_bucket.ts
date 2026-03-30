// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import type { QueueOptions, ReplenishingRateLimiter } from "./types.ts";
import { createReplenishingLimiter } from "./_replenishing_limiter.ts";
import { createTokenBucketOps } from "./_algorithms.ts";
import {
  assertNonNegativeInteger,
  assertPositiveFinite,
  assertPositiveInteger,
} from "./_validation.ts";

/**
 * Options for {@linkcode createTokenBucket}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface TokenBucketOptions extends QueueOptions {
  /** Maximum tokens the bucket can hold. */
  limit: number;
  /** Tokens added each replenishment period. */
  tokensPerPeriod: number;
  /** Replenishment interval in milliseconds. */
  replenishmentPeriod: number;
  /**
   * Start an internal timer for automatic replenishment.
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
 * Create a token bucket rate limiter. Tokens are added periodically, making
 * this strategy ideal for smoothing bursty traffic.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Basic usage
 * ```ts
 * import { createTokenBucket } from "@std/rate-limit/token-bucket";
 * import { assert } from "@std/assert";
 *
 * using limiter = createTokenBucket({
 *   limit: 10,
 *   tokensPerPeriod: 1,
 *   replenishmentPeriod: 1000,
 * });
 *
 * using lease = limiter.tryAcquire();
 * assert(lease.acquired);
 * ```
 *
 * @example Manual replenishment
 * ```ts no-assert
 * import { createTokenBucket } from "@std/rate-limit/token-bucket";
 *
 * using limiter = createTokenBucket({
 *   limit: 10,
 *   tokensPerPeriod: 5,
 *   replenishmentPeriod: 1000,
 *   autoReplenishment: false,
 * });
 *
 * limiter.replenish();
 * ```
 *
 * @param options Configuration for the token bucket.
 * @returns A {@linkcode ReplenishingRateLimiter}.
 */
export function createTokenBucket(
  options: TokenBucketOptions,
): ReplenishingRateLimiter {
  const context = "token bucket";
  assertPositiveInteger(context, "limit", options.limit);
  assertPositiveInteger(context, "tokensPerPeriod", options.tokensPerPeriod);
  assertPositiveFinite(
    context,
    "replenishmentPeriod",
    options.replenishmentPeriod,
  );
  if (options.tokensPerPeriod > options.limit) {
    throw new RangeError(
      `Cannot create token bucket: 'tokensPerPeriod' (${options.tokensPerPeriod}) exceeds 'limit' (${options.limit})`,
    );
  }
  assertNonNegativeInteger(context, "queueLimit", options.queueLimit);

  const { limit, tokensPerPeriod, replenishmentPeriod } = options;
  const clock = options.clock ?? Date.now;
  const ops = createTokenBucketOps(
    limit,
    replenishmentPeriod,
    tokensPerPeriod,
  );
  const state = ops.create(clock());
  let lastNow = 0;

  return createReplenishingLimiter(
    {
      replenishmentPeriod,
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
        lastNow = state.lastRefill + replenishmentPeriod;
        ops.replenish(state);
      },
      computeRetryAfter(permits: number): number {
        return ops.computeRetryAfter(state, permits, lastNow);
      },
    },
  );
}
