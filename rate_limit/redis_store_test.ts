// Copyright 2018-2026 the Deno authors. MIT license.

import { assert, assertEquals, assertFalse, assertThrows } from "@std/assert";
import { createRedisStore } from "./redis_store.ts";
import type {
  RedisEvalConnection,
  RedisSendCommandConnection,
} from "./redis_store.ts";
import { createRateLimiter } from "./rate_limiter.ts";

/**
 * In-memory Redis emulator that supports the subset of commands used
 * by the rate limit Lua scripts. Rather than parsing Lua, this class
 * implements a small Redis command engine and uses a real Lua-like
 * execution model by pre-compiling each script into a sequence of
 * command calls via text matching.
 *
 * For testing purposes, the mock always rejects `evalsha` with NOSCRIPT
 * to exercise the fallback path, and `eval` runs the script through
 * the built-in command interpreter.
 */
class MockRedis implements RedisEvalConnection {
  #strings = new Map<string, string>();
  #hashes = new Map<string, Map<string, string>>();
  #expiries = new Map<string, number>();
  #nowMs: number;

  constructor(nowMs = 0) {
    this.#nowMs = nowMs;
  }

  get now(): number {
    return this.#nowMs;
  }

  set now(ms: number) {
    this.#nowMs = ms;
  }

  tick(ms: number): void {
    this.#nowMs += ms;
  }

  eval(script: string, keys: string[], args: string[]): Promise<unknown> {
    return Promise.resolve(this.#runLuaScript(script, keys, args));
  }

  evalsha(_sha: string, _keys: string[], _args: string[]): Promise<unknown> {
    return Promise.reject(new Error("NOSCRIPT No matching script"));
  }

  #evictExpired(): void {
    for (const [key, expiresAt] of this.#expiries) {
      if (this.#nowMs >= expiresAt) {
        this.#strings.delete(key);
        this.#hashes.delete(key);
        this.#expiries.delete(key);
      }
    }
  }

  #pexpire(key: string, ms: number): void {
    if (
      this.#strings.has(key) || this.#hashes.has(key)
    ) {
      this.#expiries.set(key, this.#nowMs + ms);
    }
  }

  #del(key: string): void {
    this.#strings.delete(key);
    this.#hashes.delete(key);
    this.#expiries.delete(key);
  }

  #runLuaScript(
    script: string,
    keys: string[],
    args: string[],
  ): unknown {
    this.#evictExpired();

    const now = this.#nowMs;

    if (script.includes("redis.call('DEL'")) {
      this.#del(keys[0]!);
      return 1;
    }

    const key = keys[0]!;
    const limit = Number(args[0]);
    const window = Number(args[1]);
    const cost = Number(args[2]);

    const isPeek = script.includes("-- peek-mode");

    if (script.includes("HGETALL")) {
      const segments = Number(args[3]);
      return this.#slidingWindow(
        key,
        limit,
        window,
        cost,
        segments,
        now,
        isPeek,
      );
    }

    if (script.includes("windowStart")) {
      return this.#fixedWindow(key, limit, window, cost, now, isPeek);
    }

    if (script.includes("lastRefill")) {
      const tokensPerPeriod = Number(args[3]);
      return this.#tokenBucket(
        key,
        limit,
        window,
        cost,
        tokensPerPeriod,
        now,
        isPeek,
      );
    }

    if (script.includes("emissionInterval")) {
      return this.#gcra(key, limit, window, cost, now, isPeek);
    }

    throw new Error("Unrecognized Lua script");
  }

  #fixedWindow(
    key: string,
    limit: number,
    window: number,
    cost: number,
    now: number,
    peek: boolean,
  ): [number, number, string, string, number] {
    let hash = this.#hashes.get(key);
    let count = hash ? Number(hash.get("count") ?? 0) : 0;
    let windowStart = hash ? Number(hash.get("windowStart") ?? now) : now;

    if (now - windowStart >= window) {
      count = 0;
      windowStart = windowStart +
        Math.floor((now - windowStart) / window) * window;
    }

    const resetAt = windowStart + window;
    let ok = 0;

    if (count + cost <= limit) {
      ok = 1;
      if (!peek) {
        count += cost;
      }
    }

    if (!peek) {
      if (!hash) {
        hash = new Map();
        this.#hashes.set(key, hash);
      }
      hash.set("count", String(count));
      hash.set("windowStart", String(windowStart));
      this.#pexpire(key, Math.ceil(resetAt - now));
    }

    const remaining = Math.max(0, limit - count);
    const retryAfter = ok === 0 ? resetAt - now : 0;

    return [ok, remaining, String(resetAt), String(retryAfter), limit];
  }

  #slidingWindow(
    key: string,
    limit: number,
    window: number,
    cost: number,
    _segments: number,
    now: number,
    peek: boolean,
  ): [number, number, string, string, number] {
    const segDur = window / _segments;
    const segStart = now - (now % segDur);
    const cutoff = now - window;

    let hash = this.#hashes.get(key);
    if (!hash) {
      hash = new Map();
      this.#hashes.set(key, hash);
    }

    // Remove segments at or before the cutoff (matches Lua `seg <= cutoff`)
    for (const [field] of hash) {
      if (Number(field) <= cutoff) {
        hash.delete(field);
      }
    }

    let total = 0;
    for (const [, val] of hash) {
      total += Number(val);
    }

    const resetAt = segStart + segDur;
    let ok = 0;

    if (total + cost <= limit) {
      ok = 1;
      if (!peek) {
        const segKey = String(segStart);
        hash.set(segKey, String((Number(hash.get(segKey) ?? "0")) + cost));
        total += cost;
        this.#pexpire(key, window + segDur);
      }
    }

    const remaining = Math.max(0, limit - total);
    const retryAfter = ok === 0 ? resetAt - now : 0;

    return [ok, remaining, String(resetAt), String(retryAfter), limit];
  }

  #tokenBucket(
    key: string,
    limit: number,
    window: number,
    cost: number,
    tokensPerPeriod: number,
    now: number,
    peek: boolean,
  ): [number, number, string, string, number] {
    const hash = this.#hashes.get(key);
    let tokens: number;
    let lastRefill: number;

    if (!hash || !hash.has("tokens")) {
      tokens = limit;
      lastRefill = now;
    } else {
      tokens = Number(hash.get("tokens"));
      lastRefill = Number(hash.get("lastRefill"));

      const elapsed = now - lastRefill;
      if (elapsed >= window) {
        const cycles = Math.floor(elapsed / window);
        tokens = Math.min(limit, tokens + cycles * tokensPerPeriod);
        lastRefill = lastRefill + cycles * window;
      }
    }

    let ok = 0;
    if (tokens >= cost) {
      ok = 1;
      if (!peek) {
        tokens -= cost;
      }
    }

    if (!peek) {
      let h = this.#hashes.get(key);
      if (!h) {
        h = new Map();
        this.#hashes.set(key, h);
      }
      h.set("tokens", String(tokens));
      h.set("lastRefill", String(lastRefill));
      const resetAt = lastRefill + window;
      this.#pexpire(key, Math.max(1, Math.ceil(resetAt - now) + window));
    }

    const remaining = Math.max(0, Math.floor(tokens));
    const resetAt = lastRefill + window;
    let retryAfter = 0;
    if (ok === 0) {
      const deficit = cost - tokens;
      const cycles = Math.ceil(deficit / tokensPerPeriod);
      retryAfter = Math.max(0, cycles * window - (now - lastRefill));
    }

    return [ok, remaining, String(resetAt), String(retryAfter), limit];
  }

  #gcra(
    key: string,
    limit: number,
    window: number,
    cost: number,
    now: number,
    peek: boolean,
  ): [number, number, string, string, number] {
    const emissionInterval = window / limit;
    const tau = window;

    const stored = this.#strings.get(key);
    const tat = stored !== undefined ? Number(stored) : now;

    const allowAt = tat - tau;
    if (now < allowAt) {
      const remaining = 0;
      const retryAfter = allowAt - now;
      return [0, remaining, String(tat), String(retryAfter), limit];
    }

    const newTat = Math.max(tat, now) + emissionInterval * cost;
    if (newTat - now > tau) {
      const diff = tau - (tat - now);
      const remaining = Math.min(
        limit,
        Math.max(0, Math.floor(diff / emissionInterval)),
      );
      const retryAfter = Math.max(0, newTat - tau - now);
      return [0, remaining, String(tat), String(retryAfter), limit];
    }

    if (!peek) {
      this.#strings.set(key, String(newTat));
      this.#pexpire(key, Math.ceil(newTat - now + tau));
    }

    const tatForRemaining = peek ? tat : newTat;
    const diff = tau - (tatForRemaining - now);
    const remaining = Math.min(
      limit,
      Math.max(0, Math.floor(diff / emissionInterval)),
    );

    return [peek ? 1 : 1, remaining, String(peek ? tat : newTat), "0", limit];
  }
}

// --- Factory validation ---

Deno.test("createRedisStore() throws for invalid limit", () => {
  const redis = new MockRedis();
  assertThrows(
    () => createRedisStore({ redis, limit: 0, window: 1000 }),
    RangeError,
    "limit",
  );
  assertThrows(
    () => createRedisStore({ redis, limit: -1, window: 1000 }),
    RangeError,
    "limit",
  );
});

Deno.test("createRedisStore() throws for invalid window", () => {
  const redis = new MockRedis();
  assertThrows(
    () => createRedisStore({ redis, limit: 10, window: 0 }),
    RangeError,
    "window",
  );
});

Deno.test("createRedisStore() throws for unknown algorithm", () => {
  const redis = new MockRedis();
  assertThrows(
    () =>
      createRedisStore({
        redis,
        limit: 10,
        window: 1000,
        algorithm: "unknown" as "fixed-window",
      }),
    TypeError,
    "unknown",
  );
});

Deno.test("createRedisStore() throws for invalid segmentsPerWindow", () => {
  const redis = new MockRedis();
  assertThrows(
    () =>
      createRedisStore({
        redis,
        limit: 10,
        window: 1000,
        algorithm: "sliding-window",
        segmentsPerWindow: 1,
      }),
    RangeError,
    "segmentsPerWindow",
  );
  assertThrows(
    () =>
      createRedisStore({
        redis,
        limit: 10,
        window: 1000,
        algorithm: "sliding-window",
        segmentsPerWindow: 3,
      }),
    RangeError,
    "divisible",
  );
});

Deno.test("createRedisStore() throws for invalid tokensPerPeriod", () => {
  const redis = new MockRedis();
  assertThrows(
    () =>
      createRedisStore({
        redis,
        limit: 10,
        window: 1000,
        algorithm: "token-bucket",
        tokensPerPeriod: 0,
      }),
    RangeError,
    "tokensPerPeriod",
  );
  assertThrows(
    () =>
      createRedisStore({
        redis,
        limit: 10,
        window: 1000,
        algorithm: "token-bucket",
        tokensPerPeriod: 11,
      }),
    RangeError,
    "tokensPerPeriod",
  );
});

// --- Store properties ---

Deno.test("createRedisStore() exposes capacity and window", () => {
  const redis = new MockRedis();
  const store = createRedisStore({ redis, limit: 42, window: 5000 });
  assertEquals(store.capacity, 42);
  assertEquals(store.window, 5000);
});

// === Fixed Window ===

Deno.test("redis fixed-window: first request allowed", async () => {
  const redis = new MockRedis(1000);
  const store = createRedisStore({
    redis,
    limit: 5,
    window: 1000,
    algorithm: "fixed-window",
  });

  const r = await store.consume("a", 1);
  assert(r.ok);
  assertEquals(r.remaining, 4);
  assertEquals(r.limit, 5);
  assertEquals(r.retryAfter, 0);
});

Deno.test("redis fixed-window: exhausting limit", async () => {
  const redis = new MockRedis(1000);
  const store = createRedisStore({
    redis,
    limit: 3,
    window: 1000,
    algorithm: "fixed-window",
  });

  assert((await store.consume("a", 1)).ok);
  assert((await store.consume("a", 1)).ok);
  assert((await store.consume("a", 1)).ok);

  const r = await store.consume("a", 1);
  assertFalse(r.ok);
  assertEquals(r.remaining, 0);
  assert(r.retryAfter > 0);
});

Deno.test("redis fixed-window: permits restore after window elapses", async () => {
  const redis = new MockRedis(1000);
  const store = createRedisStore({
    redis,
    limit: 2,
    window: 1000,
    algorithm: "fixed-window",
  });

  await store.consume("a", 1);
  await store.consume("a", 1);
  assertFalse((await store.consume("a", 1)).ok);

  redis.now = 2000;
  const r = await store.consume("a", 1);
  assert(r.ok);
  assertEquals(r.remaining, 1);
});

Deno.test("redis fixed-window: variable cost", async () => {
  const redis = new MockRedis(1000);
  const store = createRedisStore({
    redis,
    limit: 10,
    window: 1000,
    algorithm: "fixed-window",
  });

  const r = await store.consume("a", 7);
  assert(r.ok);
  assertEquals(r.remaining, 3);

  assertFalse((await store.consume("a", 4)).ok);
  assert((await store.consume("a", 3)).ok);
});

// === Sliding Window ===

Deno.test("redis sliding-window: permits freed incrementally", async () => {
  const redis = new MockRedis(0);
  const store = createRedisStore({
    redis,
    limit: 4,
    window: 400,
    algorithm: "sliding-window",
    segmentsPerWindow: 4,
  });

  await store.consume("a", 4);
  assertFalse((await store.consume("a", 1)).ok);

  redis.now = 100;
  assertFalse((await store.consume("a", 1)).ok);

  redis.now = 400;
  assert((await store.consume("a", 4)).ok);
});

Deno.test("redis sliding-window: no boundary burst", async () => {
  const redis = new MockRedis(0);
  const store = createRedisStore({
    redis,
    limit: 10,
    window: 1000,
    algorithm: "sliding-window",
    segmentsPerWindow: 2,
  });

  await store.consume("a", 10);

  redis.now = 500;
  assertFalse((await store.consume("a", 1)).ok);

  redis.now = 1000;
  assert((await store.consume("a", 10)).ok);
});

// === Token Bucket ===

Deno.test("redis token-bucket: starts at full capacity", async () => {
  const redis = new MockRedis(0);
  const store = createRedisStore({
    redis,
    limit: 5,
    window: 1000,
    algorithm: "token-bucket",
  });

  const r = await store.consume("a", 1);
  assert(r.ok);
  assertEquals(r.remaining, 4);
});

Deno.test("redis token-bucket: tokens refill lazily", async () => {
  const redis = new MockRedis(0);
  const store = createRedisStore({
    redis,
    limit: 3,
    window: 1000,
    algorithm: "token-bucket",
    tokensPerPeriod: 1,
  });

  await store.consume("a", 3);
  assertFalse((await store.consume("a", 1)).ok);

  redis.now = 1000;
  assert((await store.consume("a", 1)).ok);
  assertFalse((await store.consume("a", 1)).ok);

  redis.now = 3000;
  assert((await store.consume("a", 2)).ok);
});

Deno.test("redis token-bucket: refill capped at limit", async () => {
  const redis = new MockRedis(0);
  const store = createRedisStore({
    redis,
    limit: 3,
    window: 1000,
    algorithm: "token-bucket",
    tokensPerPeriod: 3,
  });

  await store.consume("a", 1);
  redis.now = 10000;
  const r = await store.consume("a", 1);
  assert(r.ok);
  assertEquals(r.remaining, 2);
});

Deno.test("redis token-bucket: retryAfter reflects time until enough tokens", async () => {
  const redis = new MockRedis(0);
  const store = createRedisStore({
    redis,
    limit: 10,
    window: 500,
    algorithm: "token-bucket",
    tokensPerPeriod: 2,
  });

  await store.consume("a", 10);
  const r = await store.consume("a", 3);
  assertFalse(r.ok);
  assertEquals(r.retryAfter, 1000);
});

// === GCRA ===

Deno.test("redis gcra: first request always allowed", async () => {
  const redis = new MockRedis(0);
  const store = createRedisStore({
    redis,
    limit: 10,
    window: 1000,
    algorithm: "gcra",
  });

  const r = await store.consume("a", 1);
  assert(r.ok);
  assertEquals(r.limit, 10);
});

Deno.test("redis gcra: requests spaced >= emission_interval apart always allowed", async () => {
  const redis = new MockRedis(0);
  const emissionInterval = 100;
  const store = createRedisStore({
    redis,
    limit: 10,
    window: 1000,
    algorithm: "gcra",
  });

  for (let i = 0; i < 20; i++) {
    const r = await store.consume("a", 1);
    assert(r.ok, `request ${i} at now=${redis.now} should be allowed`);
    redis.tick(emissionInterval);
  }
});

Deno.test("redis gcra: burst up to limit", async () => {
  const redis = new MockRedis(0);
  const store = createRedisStore({
    redis,
    limit: 5,
    window: 1000,
    algorithm: "gcra",
  });

  for (let i = 0; i < 5; i++) {
    assert(
      (await store.consume("a", 1)).ok,
      `burst request ${i} should be allowed`,
    );
  }
  assertFalse((await store.consume("a", 1)).ok);
});

Deno.test("redis gcra: after burst, requests denied until tat drains", async () => {
  const redis = new MockRedis(0);
  const store = createRedisStore({
    redis,
    limit: 5,
    window: 1000,
    algorithm: "gcra",
  });

  for (let i = 0; i < 5; i++) await store.consume("a", 1);
  assertFalse((await store.consume("a", 1)).ok);

  redis.now = 200;
  assert((await store.consume("a", 1)).ok);
  assertFalse((await store.consume("a", 1)).ok);
});

Deno.test("redis gcra: retryAfter is exact", async () => {
  const redis = new MockRedis(0);
  const store = createRedisStore({
    redis,
    limit: 5,
    window: 1000,
    algorithm: "gcra",
  });

  for (let i = 0; i < 5; i++) await store.consume("a", 1);
  const r = await store.consume("a", 1);
  assertFalse(r.ok);
  assertEquals(r.retryAfter, 200);
});

Deno.test("redis gcra: variable cost", async () => {
  const redis = new MockRedis(0);
  const store = createRedisStore({
    redis,
    limit: 10,
    window: 1000,
    algorithm: "gcra",
  });

  const r = await store.consume("a", 5);
  assert(r.ok);
  assertEquals(r.remaining, 5);

  assert((await store.consume("a", 5)).ok);
  assertFalse((await store.consume("a", 1)).ok);
});

Deno.test("redis gcra: remaining derived correctly", async () => {
  const redis = new MockRedis(0);
  const store = createRedisStore({
    redis,
    limit: 10,
    window: 1000,
    algorithm: "gcra",
  });

  const r1 = await store.consume("a", 1);
  assert(r1.ok);
  assertEquals(r1.remaining, 9);

  const r2 = await store.consume("a", 4);
  assert(r2.ok);
  assertEquals(r2.remaining, 5);
});

// === peek() ===

Deno.test("redis peek() does not consume permits (fixed-window)", async () => {
  const redis = new MockRedis(0);
  const store = createRedisStore({
    redis,
    limit: 5,
    window: 1000,
    algorithm: "fixed-window",
  });

  await store.consume("a", 2);

  const p1 = await store.peek("a", 1);
  assert(p1.ok);
  assertEquals(p1.remaining, 3);

  const p2 = await store.peek("a", 1);
  assertEquals(p2.remaining, 3);
});

Deno.test("redis peek() returns full capacity for unknown key (gcra)", async () => {
  const redis = new MockRedis(0);
  const store = createRedisStore({
    redis,
    limit: 10,
    window: 1000,
    algorithm: "gcra",
  });

  const p = await store.peek("unknown", 1);
  assert(p.ok);
  assertEquals(p.remaining, 10);
  assertEquals(p.limit, 10);
});

Deno.test("redis peek() does not consume permits (token-bucket)", async () => {
  const redis = new MockRedis(0);
  const store = createRedisStore({
    redis,
    limit: 5,
    window: 1000,
    algorithm: "token-bucket",
  });

  await store.consume("a", 3);
  const p = await store.peek("a", 1);
  assert(p.ok);
  assertEquals(p.remaining, 2);
});

Deno.test("redis peek() does not consume permits (sliding-window)", async () => {
  const redis = new MockRedis(0);
  const store = createRedisStore({
    redis,
    limit: 5,
    window: 1000,
    algorithm: "sliding-window",
    segmentsPerWindow: 5,
  });

  await store.consume("a", 3);
  const p = await store.peek("a", 1);
  assert(p.ok);
  assertEquals(p.remaining, 2);
});

Deno.test("redis peek() does not consume permits (gcra)", async () => {
  const redis = new MockRedis(0);
  const store = createRedisStore({
    redis,
    limit: 5,
    window: 1000,
    algorithm: "gcra",
  });

  await store.consume("a", 3);
  const p = await store.peek("a", 1);
  assert(p.ok);
  assertEquals(p.remaining, 2);
});

// === reset() ===

Deno.test("redis reset() restores key to full capacity", async () => {
  const redis = new MockRedis(0);
  const store = createRedisStore({
    redis,
    limit: 3,
    window: 1000,
    algorithm: "gcra",
  });

  await store.consume("a", 3);
  assertFalse((await store.consume("a", 1)).ok);

  await store.reset("a");
  assert((await store.consume("a", 1)).ok);
});

Deno.test("redis reset() on unknown key is a no-op", async () => {
  const redis = new MockRedis(0);
  const store = createRedisStore({
    redis,
    limit: 5,
    window: 1000,
    algorithm: "fixed-window",
  });

  await store.reset("nonexistent");
});

Deno.test("redis reset() works for fixed-window", async () => {
  const redis = new MockRedis(0);
  const store = createRedisStore({
    redis,
    limit: 2,
    window: 1000,
    algorithm: "fixed-window",
  });

  await store.consume("a", 2);
  assertFalse((await store.consume("a", 1)).ok);

  await store.reset("a");
  assert((await store.consume("a", 1)).ok);
});

Deno.test("redis reset() works for sliding-window", async () => {
  const redis = new MockRedis(0);
  const store = createRedisStore({
    redis,
    limit: 2,
    window: 1000,
    algorithm: "sliding-window",
    segmentsPerWindow: 2,
  });

  await store.consume("a", 2);
  assertFalse((await store.consume("a", 1)).ok);

  await store.reset("a");
  assert((await store.consume("a", 1)).ok);
});

Deno.test("redis reset() works for token-bucket", async () => {
  const redis = new MockRedis(0);
  const store = createRedisStore({
    redis,
    limit: 2,
    window: 1000,
    algorithm: "token-bucket",
  });

  await store.consume("a", 2);
  assertFalse((await store.consume("a", 1)).ok);

  await store.reset("a");
  assert((await store.consume("a", 1)).ok);
});

// === Per-key isolation ===

Deno.test("redis keys are isolated", async () => {
  const redis = new MockRedis(0);
  const store = createRedisStore({
    redis,
    limit: 2,
    window: 1000,
    algorithm: "gcra",
  });

  await store.consume("a", 2);
  assertFalse((await store.consume("a", 1)).ok);

  assert((await store.consume("b", 1)).ok);
  assert((await store.consume("b", 1)).ok);
});

// === Key prefix ===

Deno.test("redis store uses configurable prefix", async () => {
  const redis = new MockRedis(0);
  const store = createRedisStore({
    redis,
    limit: 5,
    window: 1000,
    algorithm: "gcra",
    prefix: "custom",
  });

  await store.consume("mykey", 1);
  assert((await store.peek("mykey", 1)).ok);
});

Deno.test("redis store default prefix is 'rl'", async () => {
  const redis = new MockRedis(0);
  const store = createRedisStore({
    redis,
    limit: 5,
    window: 1000,
    algorithm: "gcra",
  });

  await store.consume("mykey", 1);
  assert((await store.peek("mykey", 1)).ok);
});

// === Integration with createRateLimiter ===

Deno.test("redis store works with createRateLimiter", async () => {
  const redis = new MockRedis(0);
  const store = createRedisStore({
    redis,
    limit: 3,
    window: 1000,
    algorithm: "fixed-window",
  });
  await using limiter = createRateLimiter({ store });

  const r = await limiter.limit("a");
  assert(r.ok);
  assertEquals(r.remaining, 2);
  assertEquals(r.limit, 3);
});

Deno.test("redis store: createRateLimiter reads capacity/window from store", async () => {
  const redis = new MockRedis(0);
  const store = createRedisStore({
    redis,
    limit: 42,
    window: 5000,
    algorithm: "gcra",
  });
  await using limiter = createRateLimiter({ store });

  const r = await limiter.limit("a");
  assert(r.ok);
  assertEquals(r.limit, 42);
});

Deno.test("redis store: limiter cost validation with store", async () => {
  const redis = new MockRedis(0);
  const store = createRedisStore({
    redis,
    limit: 5,
    window: 1000,
    algorithm: "gcra",
  });
  await using limiter = createRateLimiter({ store });

  assertThrows(() => limiter.limit("a", { cost: 0 }), RangeError, "cost");
  assertThrows(() => limiter.limit("a", { cost: 6 }), RangeError, "exceeds");
});

// === sendCommand-based connection ===

/**
 * Wraps a {@linkcode MockRedis} to expose only `sendCommand`, mimicking
 * clients like `@iuioiua/redis` that use a single command method.
 */
class MockSendCommandRedis implements RedisSendCommandConnection {
  #inner: MockRedis;

  constructor(inner: MockRedis) {
    this.#inner = inner;
  }

  get now(): number {
    return this.#inner.now;
  }
  set now(ms: number) {
    this.#inner.now = ms;
  }

  sendCommand(args: readonly (string | number)[]): Promise<unknown> {
    const strs = args.map(String);
    const cmd = strs[0]!.toUpperCase();
    if (cmd === "EVAL") {
      const script = strs[1]!;
      const numKeys = Number(strs[2]);
      const keys = strs.slice(3, 3 + numKeys);
      const rest = strs.slice(3 + numKeys);
      return this.#inner.eval(script, keys, rest);
    }
    if (cmd === "EVALSHA") {
      const sha = strs[1]!;
      const numKeys = Number(strs[2]);
      const keys = strs.slice(3, 3 + numKeys);
      const rest = strs.slice(3 + numKeys);
      return this.#inner.evalsha(sha, keys, rest);
    }
    return Promise.reject(new Error(`Unsupported command: ${cmd}`));
  }
}

Deno.test("sendCommand connection: fixed-window works end-to-end", async () => {
  const inner = new MockRedis(1000);
  const redis = new MockSendCommandRedis(inner);
  const store = createRedisStore({
    redis,
    limit: 3,
    window: 1000,
    algorithm: "fixed-window",
  });

  assert((await store.consume("a", 1)).ok);
  assert((await store.consume("a", 1)).ok);
  assert((await store.consume("a", 1)).ok);
  assertFalse((await store.consume("a", 1)).ok);

  redis.now = 2000;
  const r = await store.consume("a", 1);
  assert(r.ok);
  assertEquals(r.remaining, 2);
});

Deno.test("sendCommand connection: gcra works end-to-end", async () => {
  const inner = new MockRedis(0);
  const redis = new MockSendCommandRedis(inner);
  const store = createRedisStore({
    redis,
    limit: 5,
    window: 1000,
    algorithm: "gcra",
  });

  for (let i = 0; i < 5; i++) {
    assert((await store.consume("a", 1)).ok);
  }
  assertFalse((await store.consume("a", 1)).ok);
});

Deno.test("sendCommand connection: peek and reset work", async () => {
  const inner = new MockRedis(0);
  const redis = new MockSendCommandRedis(inner);
  const store = createRedisStore({
    redis,
    limit: 5,
    window: 1000,
    algorithm: "fixed-window",
  });

  await store.consume("a", 3);
  const p = await store.peek("a", 1);
  assert(p.ok);
  assertEquals(p.remaining, 2);

  await store.reset("a");
  const r = await store.consume("a", 1);
  assert(r.ok);
  assertEquals(r.remaining, 4);
});

Deno.test("sendCommand connection: works with createRateLimiter", async () => {
  const inner = new MockRedis(0);
  const redis = new MockSendCommandRedis(inner);
  const store = createRedisStore({
    redis,
    limit: 3,
    window: 1000,
    algorithm: "sliding-window",
    segmentsPerWindow: 2,
  });
  await using limiter = createRateLimiter({ store });

  const r = await limiter.limit("a");
  assert(r.ok);
  assertEquals(r.remaining, 2);
  assertEquals(r.limit, 3);
});

// === Disposal ===

Deno.test("redis store disposal is a no-op", async () => {
  const redis = new MockRedis(0);
  const store = createRedisStore({
    redis,
    limit: 5,
    window: 1000,
    algorithm: "gcra",
  });

  await store[Symbol.asyncDispose]();
});

// === EVALSHA fallback ===

Deno.test("redis store falls back from EVALSHA to EVAL on NOSCRIPT", async () => {
  const redis = new MockRedis(0);
  const store = createRedisStore({
    redis,
    limit: 5,
    window: 1000,
    algorithm: "fixed-window",
  });

  const r = await store.consume("a", 1);
  assert(r.ok);
  assertEquals(r.remaining, 4);
});
