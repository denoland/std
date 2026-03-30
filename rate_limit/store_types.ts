// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import type { RateLimitResult } from "./rate_limiter.ts";

/**
 * Algorithm configuration shared by all store backends.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface AlgorithmOptions {
  /** Maximum permits per key per window/cycle. */
  limit: number;
  /** Window duration in milliseconds. */
  window: number;
  /**
   * Algorithm to use.
   *
   * @default {"sliding-window"}
   */
  algorithm?: "fixed-window" | "sliding-window" | "token-bucket" | "gcra";
  /**
   * Number of segments for the sliding window algorithm.
   *
   * @default {10}
   */
  segmentsPerWindow?: number;
  /**
   * For token bucket: tokens added per replenishment period.
   *
   * @default {limit}
   */
  tokensPerPeriod?: number;
}

/**
 * A pluggable backend for keyed rate limiting. Stores own the per-key
 * algorithm state and are self-contained: they carry `capacity` and `window`
 * so `createRateLimiter` reads configuration from the store rather than
 * duplicating it.
 *
 * Each store owns its own time source. In-memory stores default to
 * `Date.now` (overridable via `clock` for `FakeTime` testing); distributed
 * stores (e.g. Redis) use server-side time.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface RateLimitStore extends AsyncDisposable {
  /** The configured permit limit per key per window. */
  readonly capacity: number;
  /** The window duration in milliseconds. */
  readonly window: number;

  /**
   * Check and consume permits for a key.
   *
   * @param key Identifier for the rate limit subject.
   * @param cost Number of permits to consume.
   * @returns The rate limit decision and metadata.
   */
  consume(key: string, cost: number): Promise<RateLimitResult>;

  /**
   * Check the current state for a key without consuming any permits.
   *
   * @param key Identifier for the rate limit subject.
   * @param cost Number of permits to check.
   * @returns The rate limit decision and metadata.
   */
  peek(key: string, cost: number): Promise<RateLimitResult>;

  /**
   * Reset all state for a key, restoring it to full capacity.
   *
   * @param key Identifier for the rate limit subject.
   */
  reset(key: string): Promise<void>;
}
