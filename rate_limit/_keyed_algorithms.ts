// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import type { AlgorithmOps, AlgorithmResult } from "./_algorithms.ts";
import {
  createFixedWindowOps,
  createGcraOps,
  createSlidingWindowOps,
  createTokenBucketOps,
} from "./_algorithms.ts";

/** Internal interface for per-key algorithm strategies. */
export interface KeyedAlgorithm {
  limit(key: string, cost: number, now: number): AlgorithmResult;
  peek(key: string, cost: number, now: number): AlgorithmResult;
  has(key: string): boolean;
  reset(key: string): void;
  readonly size: number;
  evict(now: number, ttl: number): void;
  clear(): void;
}

/** Wraps AlgorithmOps with a Map and eviction. */
function createKeyedAlgorithm<S extends object>(
  ops: AlgorithmOps<S>,
): KeyedAlgorithm {
  const keys = new Map<string, S & { lastAccess: number }>();

  function getOrCreate(key: string, now: number): S & { lastAccess: number } {
    let state = keys.get(key);
    if (state === undefined) {
      const base = ops.create(now);
      (base as S & { lastAccess: number }).lastAccess = now;
      state = base as S & { lastAccess: number };
      keys.set(key, state);
    }
    return state;
  }

  function peekDefault(cost: number, now: number): AlgorithmResult {
    return {
      ok: cost <= ops.limit,
      remaining: ops.limit,
      resetAt: now,
      retryAfter: 0,
      limit: ops.limit,
    };
  }

  return {
    limit(key, cost, now) {
      const state = getOrCreate(key, now);
      ops.advance(state, now);
      state.lastAccess = now;
      const ok = ops.tryConsume(state, cost, now);
      return ops.result(state, ok, cost, now);
    },
    // Advances time (segment rotation, token refill) so metadata is
    // accurate, but does not consume permits or update lastAccess.
    peek(key, cost, now) {
      const state = keys.get(key);
      if (state === undefined) return peekDefault(cost, now);
      ops.advance(state, now);
      const ok = ops.wouldAllow(state, cost, now);
      return ops.result(state, ok, cost, now);
    },
    has(key) {
      return keys.has(key);
    },
    reset(key) {
      keys.delete(key);
    },
    get size() {
      return keys.size;
    },
    evict(now, ttl) {
      for (const [k, state] of keys) {
        if (now - state.lastAccess > ttl) keys.delete(k);
      }
    },
    clear() {
      keys.clear();
    },
  };
}

// --- Fixed Window ---

/**
 * Creates a keyed fixed-window rate limit algorithm.
 *
 * @param limit Maximum permits per key per window. Must be a positive integer.
 * @param window Window duration in milliseconds. Must be a positive finite number.
 * @returns A keyed algorithm using fixed-window semantics.
 */
export function createFixedWindowAlgorithm(
  limit: number,
  window: number,
): KeyedAlgorithm {
  return createKeyedAlgorithm(createFixedWindowOps(limit, window));
}

// --- Sliding Window ---

/**
 * Creates a keyed sliding-window rate limit algorithm.
 *
 * @param limit Maximum permits per key per window. Must be a positive integer.
 * @param window Window duration in milliseconds. Must be a positive finite number.
 * @param segmentsPerWindow Number of segments per window. Must be an integer >= 2.
 * @returns A keyed algorithm using sliding-window semantics.
 */
export function createSlidingWindowAlgorithm(
  limit: number,
  window: number,
  segmentsPerWindow: number,
): KeyedAlgorithm {
  return createKeyedAlgorithm(
    createSlidingWindowOps(limit, window, segmentsPerWindow),
  );
}

// --- Token Bucket ---

/**
 * Creates a keyed token-bucket rate limit algorithm.
 *
 * @param limit Bucket capacity (max tokens per key). Must be a positive integer.
 * @param window Refill cycle duration in milliseconds. Must be a positive finite number.
 * @param tokensPerPeriod Tokens added per replenishment period. Must be a positive integer.
 * @returns A keyed algorithm using token-bucket semantics.
 */
export function createTokenBucketAlgorithm(
  limit: number,
  window: number,
  tokensPerPeriod: number,
): KeyedAlgorithm {
  return createKeyedAlgorithm(
    createTokenBucketOps(limit, window, tokensPerPeriod),
  );
}

// --- GCRA ---

/**
 * Creates a keyed GCRA (Generic Cell Rate Algorithm) rate limit algorithm.
 *
 * @param limit Maximum permits per key per window. Must be a positive integer.
 * @param window Window (tau) in milliseconds. Must be a positive finite number.
 * @returns A keyed algorithm using GCRA semantics.
 */
export function createGcraAlgorithm(
  limit: number,
  window: number,
): KeyedAlgorithm {
  return createKeyedAlgorithm(createGcraOps(limit, window));
}
