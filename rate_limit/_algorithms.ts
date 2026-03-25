// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import { RollingCounter } from "@std/data-structures/unstable-rolling-counter";
import { assertPositiveFinite, assertPositiveInteger } from "./_validation.ts";

/**
 * Result returned by algorithm operations. All fields are always present
 * regardless of whether the request was allowed.
 *
 * **Metadata semantics vary by algorithm:**
 *
 * - `retryAfter` is the *minimum* delay before capacity *may* free up. For
 *   sliding-window this is the time until the next segment rotation, which may
 *   not free enough permits for a high-cost request. For token-bucket and GCRA
 *   the value accounts for the requested cost.
 * - `resetAt` is the timestamp of the next replenishment event (segment
 *   rotation, window boundary, or refill cycle). For sliding-window and
 *   token-bucket this is *not* necessarily when full capacity is restored.
 */
export interface AlgorithmResult {
  readonly ok: boolean;
  readonly remaining: number;
  readonly resetAt: number;
  readonly retryAfter: number;
  readonly limit: number;
}

/**
 * Pure state machine for a rate limit algorithm. No Map, no timers, no keys.
 * Used by both the keyed layer (Map + eviction) and the primitives (queue +
 * timer).
 */
export interface AlgorithmOps<S> {
  /** Create initial state for a new key or new instance. */
  create(now: number): S;
  /** Advance time (rotate segments, refill tokens, reset window). Mutates state. */
  advance(state: S, now: number): void;
  /** Try to consume `cost` permits. Returns true and mutates state if allowed. */
  tryConsume(state: S, cost: number, now: number): boolean;
  /** Return whether a request of `cost` would be allowed without mutating state. */
  wouldAllow(state: S, cost: number, now: number): boolean;
  /** Replenish permits (one timer tick). Mutates state. No-op for algorithms without timer-based replenishment (e.g. GCRA). */
  replenish(state: S): void;
  /** Compute result metadata (remaining, resetAt, retryAfter). */
  result(state: S, ok: boolean, cost: number, now: number): AlgorithmResult;
  /** Compute the retry delay for a denied request without allocating a result object. */
  computeRetryAfter(state: S, cost: number, now: number): number;
  /** The configured permit limit. */
  readonly limit: number;
}

// --- Fixed Window ---

/** State for the fixed-window algorithm: count in current window and window start time. */
export interface FixedWindowState {
  count: number;
  windowStart: number;
}

/**
 * Creates ops for the fixed-window algorithm. Callers must pass valid parameters.
 *
 * @param limit Maximum permits per window. Must be a positive integer.
 * @param window Window duration in milliseconds. Must be a positive finite number.
 * @returns Algorithm ops for fixed-window rate limiting.
 */
export function createFixedWindowOps(
  limit: number,
  window: number,
): AlgorithmOps<FixedWindowState> {
  const context = "fixed window";
  assertPositiveInteger(context, "limit", limit);
  assertPositiveFinite(context, "window", window);
  return {
    limit,
    create(now) {
      return { count: 0, windowStart: now };
    },
    advance(state, now) {
      if (now - state.windowStart >= window) {
        state.count = 0;
        state.windowStart = state.windowStart +
          Math.floor((now - state.windowStart) / window) * window;
      }
    },
    tryConsume(state, cost, _now) {
      if (state.count + cost > limit) return false;
      state.count += cost;
      return true;
    },
    wouldAllow(state, cost, _now) {
      return state.count + cost <= limit;
    },
    replenish(state) {
      state.count = 0;
    },
    result(state, ok, cost, now) {
      return {
        ok,
        remaining: Math.max(0, limit - state.count),
        resetAt: state.windowStart + window,
        retryAfter: ok ? 0 : this.computeRetryAfter(state, cost, now),
        limit,
      };
    },
    computeRetryAfter(state, _cost, now) {
      return state.windowStart + window - now;
    },
  };
}

// --- Sliding Window ---

/** State for the sliding-window algorithm: segment counter and current segment start time. */
export interface SlidingWindowState {
  counter: RollingCounter;
  segmentStart: number;
}

/**
 * Creates ops for the sliding-window algorithm. Callers must pass valid parameters.
 *
 * @param limit Maximum permits per window. Must be a positive integer.
 * @param window Window duration in milliseconds. Must be a positive finite number.
 * @param segmentsPerWindow Number of segments. Must be an integer >= 2.
 * @returns Algorithm ops for sliding-window rate limiting.
 */
export function createSlidingWindowOps(
  limit: number,
  window: number,
  segmentsPerWindow: number,
): AlgorithmOps<SlidingWindowState> {
  const context = "sliding window";
  assertPositiveInteger(context, "limit", limit);
  assertPositiveFinite(context, "window", window);
  if (!Number.isInteger(segmentsPerWindow) || segmentsPerWindow < 2) {
    throw new RangeError(
      `Cannot create ${context}: 'segmentsPerWindow' must be an integer >= 2, received ${segmentsPerWindow}`,
    );
  }
  if (window % segmentsPerWindow !== 0) {
    throw new RangeError(
      `Cannot create ${context}: 'window' (${window}) must be evenly divisible by 'segmentsPerWindow' (${segmentsPerWindow})`,
    );
  }
  const segmentDuration = window / segmentsPerWindow;

  return {
    limit,
    create(now) {
      return {
        counter: new RollingCounter(segmentsPerWindow),
        segmentStart: now,
      };
    },
    advance(state, now) {
      const elapsed = now - state.segmentStart;
      if (elapsed >= segmentDuration) {
        const rotations = Math.floor(elapsed / segmentDuration);
        state.counter.rotate(rotations);
        state.segmentStart += rotations * segmentDuration;
      }
    },
    tryConsume(state, cost, _now) {
      if (state.counter.total + cost > limit) return false;
      state.counter.increment(cost);
      return true;
    },
    wouldAllow(state, cost, _now) {
      return state.counter.total + cost <= limit;
    },
    replenish(state) {
      state.counter.rotate();
      state.segmentStart += segmentDuration;
    },
    result(state, ok, cost, now) {
      return {
        ok,
        remaining: Math.max(0, limit - state.counter.total),
        resetAt: state.segmentStart + segmentDuration,
        retryAfter: ok ? 0 : this.computeRetryAfter(state, cost, now),
        limit,
      };
    },
    computeRetryAfter(state, _cost, now) {
      return state.segmentStart + segmentDuration - now;
    },
  };
}

// --- Token Bucket ---

/** State for the token-bucket algorithm: current tokens and last refill time. */
export interface TokenBucketState {
  tokens: number;
  lastRefill: number;
}

/**
 * Creates ops for the token-bucket algorithm. Callers must pass valid parameters.
 *
 * @param limit Maximum tokens (bucket capacity). Must be a positive integer.
 * @param window Refill cycle duration in milliseconds. Must be a positive finite number.
 * @param tokensPerPeriod Tokens added per replenishment period. Must be a positive integer.
 * @returns Algorithm ops for token-bucket rate limiting.
 */
export function createTokenBucketOps(
  limit: number,
  window: number,
  tokensPerPeriod: number,
): AlgorithmOps<TokenBucketState> {
  const context = "token bucket";
  assertPositiveInteger(context, "limit", limit);
  assertPositiveFinite(context, "window", window);
  assertPositiveInteger(context, "tokensPerPeriod", tokensPerPeriod);
  return {
    limit,
    create(now) {
      return { tokens: limit, lastRefill: now };
    },
    advance(state, now) {
      const elapsed = now - state.lastRefill;
      if (elapsed >= window) {
        const cycles = Math.floor(elapsed / window);
        state.tokens = Math.min(limit, state.tokens + cycles * tokensPerPeriod);
        state.lastRefill += cycles * window;
      }
    },
    tryConsume(state, cost, _now) {
      if (state.tokens < cost) return false;
      state.tokens -= cost;
      return true;
    },
    wouldAllow(state, cost, _now) {
      return state.tokens >= cost;
    },
    replenish(state) {
      state.tokens = Math.min(limit, state.tokens + tokensPerPeriod);
      state.lastRefill += window;
    },
    result(state, ok, cost, now) {
      const remaining = Math.max(0, Math.floor(state.tokens));
      return {
        ok,
        remaining,
        resetAt: state.lastRefill + window,
        retryAfter: ok ? 0 : this.computeRetryAfter(state, cost, now),
        limit,
      };
    },
    computeRetryAfter(state, cost, now) {
      const deficit = cost - state.tokens;
      const cycles = Math.ceil(deficit / tokensPerPeriod);
      return Math.max(0, cycles * window - (now - state.lastRefill));
    },
  };
}

// --- GCRA (Generic Cell Rate Algorithm) ---

/** State for GCRA: theoretical arrival time (tat) of the last request. */
export interface GcraState {
  tat: number;
}

/**
 * Creates ops for the GCRA (Generic Cell Rate Algorithm). Callers must pass valid parameters.
 *
 * @param limit Maximum permits per window. Must be a positive integer.
 * @param window Window (tau) in milliseconds. Must be a positive finite number.
 * @returns Algorithm ops for GCRA rate limiting.
 */
export function createGcraOps(
  limit: number,
  window: number,
): AlgorithmOps<GcraState> {
  const context = "gcra";
  assertPositiveInteger(context, "limit", limit);
  assertPositiveFinite(context, "window", window);
  const emissionInterval = window / limit;
  const tau = window;

  function remaining(state: GcraState, now: number): number {
    const diff = tau - (state.tat - now);
    return Math.min(limit, Math.max(0, Math.floor(diff / emissionInterval)));
  }

  return {
    limit,
    create(now) {
      return { tat: now };
    },
    advance(_state, _now) {},
    tryConsume(state: GcraState, cost: number, now: number) {
      const allowAt = state.tat - tau;
      if (now < allowAt) return false;
      const newTat = Math.max(state.tat, now) + emissionInterval * cost;
      if (newTat - now > tau) return false;
      state.tat = newTat;
      return true;
    },
    wouldAllow(state: GcraState, cost: number, now: number) {
      const allowAt = state.tat - tau;
      if (now < allowAt) return false;
      const newTat = Math.max(state.tat, now) + emissionInterval * cost;
      return newTat - now <= tau;
    },
    // No-op: GCRA has no timer-based replenishment.
    replenish(_state) {},
    result(state, ok, cost, now) {
      return {
        ok,
        remaining: remaining(state, now),
        resetAt: state.tat,
        retryAfter: ok ? 0 : this.computeRetryAfter(state, cost, now),
        limit,
      };
    },
    computeRetryAfter(state, cost, now) {
      const allowAt = state.tat - tau;
      if (now < allowAt) return allowAt - now;
      const newTat = Math.max(state.tat, now) + emissionInterval * cost;
      return Math.max(0, newTat - tau - now);
    },
  };
}
