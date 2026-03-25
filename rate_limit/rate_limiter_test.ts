// Copyright 2018-2026 the Deno authors. MIT license.

import { assert, assertEquals, assertFalse, assertThrows } from "@std/assert";
import { FakeTime } from "@std/testing/time";
import { createRateLimiter } from "./rate_limiter.ts";

// --- Factory validation ---

Deno.test("createRateLimiter() throws for invalid limit", () => {
  assertThrows(
    () => createRateLimiter({ limit: 0, window: 1000 }),
    RangeError,
    "limit",
  );
  assertThrows(
    () => createRateLimiter({ limit: -1, window: 1000 }),
    RangeError,
    "limit",
  );
  assertThrows(
    () => createRateLimiter({ limit: 1.5, window: 1000 }),
    RangeError,
    "limit",
  );
});

Deno.test("createRateLimiter() throws for invalid window", () => {
  assertThrows(
    () => createRateLimiter({ limit: 10, window: 0 }),
    RangeError,
    "window",
  );
  assertThrows(
    () => createRateLimiter({ limit: 10, window: -100 }),
    RangeError,
    "window",
  );
});

Deno.test("createRateLimiter() throws for invalid segmentsPerWindow", () => {
  assertThrows(
    () =>
      createRateLimiter({
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
      createRateLimiter({
        limit: 10,
        window: 1000,
        algorithm: "sliding-window",
        segmentsPerWindow: 3,
      }),
    RangeError,
    "divisible",
  );
});

Deno.test("createRateLimiter() throws for invalid tokensPerPeriod", () => {
  assertThrows(
    () =>
      createRateLimiter({
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
      createRateLimiter({
        limit: 10,
        window: 1000,
        algorithm: "token-bucket",
        tokensPerPeriod: 11,
      }),
    RangeError,
    "tokensPerPeriod",
  );
});

Deno.test("createRateLimiter() throws for invalid eviction options when evictionTtl > 0", () => {
  assertThrows(
    () =>
      createRateLimiter({
        limit: 10,
        window: 1000,
        evictionTtl: 5000,
        evictionInterval: 0,
      }),
    RangeError,
    "evictionInterval",
  );
  assertThrows(
    () =>
      createRateLimiter({
        limit: 10,
        window: 1000,
        evictionTtl: 5000,
        evictionInterval: -100,
      }),
    RangeError,
    "evictionInterval",
  );
  assertThrows(
    () =>
      createRateLimiter({
        limit: 10,
        window: 1000,
        evictionTtl: Infinity,
        evictionInterval: 60_000,
      }),
    RangeError,
    "evictionTtl",
  );
});

Deno.test("createRateLimiter() throws for negative evictionTtl", () => {
  assertThrows(
    () =>
      createRateLimiter({
        limit: 10,
        window: 1000,
        evictionTtl: -1,
      }),
    RangeError,
    "evictionTtl",
  );
  assertThrows(
    () =>
      createRateLimiter({
        limit: 10,
        window: 1000,
        evictionTtl: NaN,
      }),
    RangeError,
    "evictionTtl",
  );
});

Deno.test("createRateLimiter() throws for invalid cost", () => {
  using _time = new FakeTime();
  using limiter = createRateLimiter({ limit: 10, window: 1000 });

  assertThrows(() => limiter.limit("a", { cost: 0 }), RangeError, "cost");
  assertThrows(() => limiter.limit("a", { cost: -1 }), RangeError, "cost");
  assertThrows(() => limiter.limit("a", { cost: 1.5 }), RangeError, "cost");
  assertThrows(() => limiter.limit("a", { cost: 11 }), RangeError, "exceeds");
});

Deno.test("createRateLimiter() accepts all algorithms", () => {
  using _time = new FakeTime();
  for (
    const algorithm of [
      "fixed-window",
      "sliding-window",
      "token-bucket",
      "gcra",
    ] as const
  ) {
    using limiter = createRateLimiter({
      limit: 10,
      window: 1000,
      algorithm,
    });
    const result = limiter.limit("key");
    assert(result.ok);
  }
});

// === Fixed window ===

Deno.test("fixed-window: first request allowed with correct remaining", () => {
  const now = 1000;
  using limiter = createRateLimiter({
    limit: 5,
    window: 1000,
    algorithm: "fixed-window",
    evictionTtl: 0,
    clock: () => now,
  });

  const r = limiter.limit("a");
  assert(r.ok);
  assertEquals(r.remaining, 4);
  assertEquals(r.limit, 5);
  assertEquals(r.retryAfter, 0);
});

Deno.test("fixed-window: exhausting limit returns ok: false", () => {
  const now = 1000;
  using limiter = createRateLimiter({
    limit: 3,
    window: 1000,
    algorithm: "fixed-window",
    evictionTtl: 0,
    clock: () => now,
  });

  assert(limiter.limit("a").ok);
  assert(limiter.limit("a").ok);
  assert(limiter.limit("a").ok);

  const r = limiter.limit("a");
  assertFalse(r.ok);
  assertEquals(r.remaining, 0);
  assert(r.retryAfter > 0);
  assertEquals(r.resetAt, 2000);
});

Deno.test("fixed-window: permits restore after window elapses", () => {
  let now = 1000;
  using limiter = createRateLimiter({
    limit: 2,
    window: 1000,
    algorithm: "fixed-window",
    evictionTtl: 0,
    clock: () => now,
  });

  limiter.limit("a");
  limiter.limit("a");
  assertFalse(limiter.limit("a").ok);

  now = 2000;
  const r = limiter.limit("a");
  assert(r.ok);
  assertEquals(r.remaining, 1);
});

Deno.test("fixed-window: variable cost consumes multiple permits", () => {
  const now = 1000;
  using limiter = createRateLimiter({
    limit: 10,
    window: 1000,
    algorithm: "fixed-window",
    evictionTtl: 0,
    clock: () => now,
  });

  const r = limiter.limit("a", { cost: 7 });
  assert(r.ok);
  assertEquals(r.remaining, 3);

  assertFalse(limiter.limit("a", { cost: 4 }).ok);
  assert(limiter.limit("a", { cost: 3 }).ok);
});

// === Sliding window ===

Deno.test("sliding-window: permits freed incrementally as segments rotate", () => {
  let now = 0;
  using limiter = createRateLimiter({
    limit: 4,
    window: 400,
    algorithm: "sliding-window",
    segmentsPerWindow: 4,
    evictionTtl: 0,
    clock: () => now,
  });

  limiter.limit("a", { cost: 4 });
  assertFalse(limiter.limit("a").ok);

  now = 100;
  assertFalse(limiter.limit("a").ok);
  now = 200;
  assertFalse(limiter.limit("a").ok);
  now = 300;
  assertFalse(limiter.limit("a").ok);

  now = 400;
  assert(limiter.limit("a", { cost: 4 }).ok);
});

Deno.test("sliding-window: no boundary burst", () => {
  let now = 0;
  using limiter = createRateLimiter({
    limit: 10,
    window: 1000,
    algorithm: "sliding-window",
    segmentsPerWindow: 2,
    evictionTtl: 0,
    clock: () => now,
  });

  limiter.limit("a", { cost: 10 });

  now = 500;
  assertFalse(limiter.limit("a").ok);

  now = 1000;
  assert(limiter.limit("a", { cost: 10 }).ok);
});

Deno.test("sliding-window: retryAfter reflects next segment rotation", () => {
  const now = 0;
  using limiter = createRateLimiter({
    limit: 1,
    window: 1000,
    algorithm: "sliding-window",
    segmentsPerWindow: 4,
    evictionTtl: 0,
    clock: () => now,
  });

  limiter.limit("a");
  const r = limiter.limit("a");
  assertFalse(r.ok);
  assertEquals(r.retryAfter, 250);
});

// === Token bucket ===

Deno.test("token-bucket: starts at full capacity", () => {
  const now = 0;
  using limiter = createRateLimiter({
    limit: 5,
    window: 1000,
    algorithm: "token-bucket",
    evictionTtl: 0,
    clock: () => now,
  });

  const r = limiter.limit("a");
  assert(r.ok);
  assertEquals(r.remaining, 4);
});

Deno.test("token-bucket: tokens refill lazily on access", () => {
  let now = 0;
  using limiter = createRateLimiter({
    limit: 3,
    window: 1000,
    algorithm: "token-bucket",
    tokensPerPeriod: 1,
    evictionTtl: 0,
    clock: () => now,
  });

  limiter.limit("a", { cost: 3 });
  assertFalse(limiter.limit("a").ok);

  now = 1000;
  assert(limiter.limit("a").ok);
  assertFalse(limiter.limit("a").ok);

  now = 3000;
  assert(limiter.limit("a", { cost: 2 }).ok);
});

Deno.test("token-bucket: refill capped at limit", () => {
  let now = 0;
  using limiter = createRateLimiter({
    limit: 3,
    window: 1000,
    algorithm: "token-bucket",
    tokensPerPeriod: 3,
    evictionTtl: 0,
    clock: () => now,
  });

  limiter.limit("a");
  now = 10000;
  const r = limiter.limit("a");
  assert(r.ok);
  assertEquals(r.remaining, 2);
});

Deno.test("token-bucket: retryAfter reflects time until enough tokens", () => {
  const now = 0;
  using limiter = createRateLimiter({
    limit: 10,
    window: 500,
    algorithm: "token-bucket",
    tokensPerPeriod: 2,
    evictionTtl: 0,
    clock: () => now,
  });

  limiter.limit("a", { cost: 10 });
  const r = limiter.limit("a", { cost: 3 });
  assertFalse(r.ok);
  assertEquals(r.retryAfter, 1000);
});

Deno.test("token-bucket: remaining is integer even with partial-cycle elapsed time", () => {
  let now = 0;
  using limiter = createRateLimiter({
    limit: 10,
    window: 300,
    algorithm: "token-bucket",
    tokensPerPeriod: 3,
    evictionTtl: 0,
    clock: () => now,
  });

  limiter.limit("a", { cost: 10 });

  now = 500;
  const r = limiter.limit("a");
  assert(r.ok);
  assert(
    Number.isInteger(r.remaining),
    `remaining (${r.remaining}) should be integer`,
  );
  assertEquals(r.remaining, 2);
});

Deno.test("token-bucket: exact token boundary with multi-cycle refill", () => {
  let now = 0;
  using limiter = createRateLimiter({
    limit: 7,
    window: 1000,
    algorithm: "token-bucket",
    tokensPerPeriod: 3,
    evictionTtl: 0,
    clock: () => now,
  });

  limiter.limit("a", { cost: 7 });
  assertFalse(limiter.limit("a").ok);

  now = 1000;
  assert(limiter.limit("a", { cost: 3 }).ok);
  assertFalse(limiter.limit("a").ok);

  now = 2000;
  assert(limiter.limit("a", { cost: 3 }).ok);
  assertFalse(limiter.limit("a").ok);
});

// === GCRA ===

Deno.test("gcra: first request always allowed", () => {
  const now = 0;
  using limiter = createRateLimiter({
    limit: 10,
    window: 1000,
    algorithm: "gcra",
    evictionTtl: 0,
    clock: () => now,
  });

  const r = limiter.limit("a");
  assert(r.ok);
  assertEquals(r.limit, 10);
});

Deno.test("gcra: requests spaced >= emission_interval apart always allowed", () => {
  let now = 0;
  const emissionInterval = 100; // window(1000) / limit(10)
  using limiter = createRateLimiter({
    limit: 10,
    window: 1000,
    algorithm: "gcra",
    evictionTtl: 0,
    clock: () => now,
  });

  for (let i = 0; i < 20; i++) {
    const r = limiter.limit("a");
    assert(r.ok, `request ${i} at now=${now} should be allowed`);
    now += emissionInterval;
  }
});

Deno.test("gcra: burst up to limit requests when idle", () => {
  const now = 0;
  using limiter = createRateLimiter({
    limit: 5,
    window: 1000,
    algorithm: "gcra",
    evictionTtl: 0,
    clock: () => now,
  });

  for (let i = 0; i < 5; i++) {
    assert(limiter.limit("a").ok, `burst request ${i} should be allowed`);
  }
  assertFalse(limiter.limit("a").ok);
});

Deno.test("gcra: after burst, requests denied until tat drains", () => {
  let now = 0;
  using limiter = createRateLimiter({
    limit: 5,
    window: 1000,
    algorithm: "gcra",
    evictionTtl: 0,
    clock: () => now,
  });

  for (let i = 0; i < 5; i++) limiter.limit("a");
  assertFalse(limiter.limit("a").ok);

  // emission_interval = 200ms. After 200ms, one slot should free.
  now = 200;
  assert(limiter.limit("a").ok);
  assertFalse(limiter.limit("a").ok);
});

Deno.test("gcra: retryAfter is exact", () => {
  const now = 0;
  using limiter = createRateLimiter({
    limit: 5,
    window: 1000,
    algorithm: "gcra",
    evictionTtl: 0,
    clock: () => now,
  });

  for (let i = 0; i < 5; i++) limiter.limit("a");
  const r = limiter.limit("a");
  assertFalse(r.ok);
  assertEquals(r.retryAfter, 200);
});

Deno.test("gcra: variable cost advances tat by emission_interval * cost", () => {
  const now = 0;
  using limiter = createRateLimiter({
    limit: 10,
    window: 1000,
    algorithm: "gcra",
    evictionTtl: 0,
    clock: () => now,
  });

  // emission_interval = 100ms. cost=5 advances tat by 500ms.
  const r = limiter.limit("a", { cost: 5 });
  assert(r.ok);
  assertEquals(r.remaining, 5);

  // 5 more slots remain
  assert(limiter.limit("a", { cost: 5 }).ok);
  assertFalse(limiter.limit("a").ok);
});

Deno.test("gcra: remaining derived correctly", () => {
  const now = 0;
  using limiter = createRateLimiter({
    limit: 10,
    window: 1000,
    algorithm: "gcra",
    evictionTtl: 0,
    clock: () => now,
  });

  const r1 = limiter.limit("a");
  assert(r1.ok);
  assertEquals(r1.remaining, 9);

  const r2 = limiter.limit("a", { cost: 4 });
  assert(r2.ok);
  assertEquals(r2.remaining, 5);
});

Deno.test("gcra: remaining never exceeds limit after long idle", () => {
  let now = 0;
  using limiter = createRateLimiter({
    limit: 10,
    window: 1000,
    algorithm: "gcra",
    evictionTtl: 0,
    clock: () => now,
  });

  limiter.limit("a");
  now += 100_000;

  const peek = limiter.peek("a");
  assert(peek.ok);
  assert(
    peek.remaining <= 10,
    `remaining (${peek.remaining}) should not exceed limit (10)`,
  );
  assertEquals(peek.remaining, 10);

  const result = limiter.limit("a");
  assert(result.ok);
  assert(
    result.remaining <= 10,
    `remaining (${result.remaining}) should not exceed limit (10)`,
  );
});

Deno.test("gcra: cost exceeding remaining burst is denied", () => {
  const now = 0;
  using limiter = createRateLimiter({
    limit: 5,
    window: 1000,
    algorithm: "gcra",
    evictionTtl: 0,
    clock: () => now,
  });

  limiter.limit("a", { cost: 3 });
  const r = limiter.limit("a", { cost: 4 });
  assertFalse(r.ok);
  assert(r.retryAfter > 0);
});

Deno.test("gcra: state is a single timestamp per key (minimal memory)", () => {
  const now = 0;
  using limiter = createRateLimiter({
    limit: 100,
    window: 1000,
    algorithm: "gcra",
    evictionTtl: 0,
    clock: () => now,
  });

  for (let i = 0; i < 1000; i++) {
    limiter.limit(`key-${i}`);
  }
  assertEquals(limiter.size, 1000);
});

// === peek() ===

Deno.test("peek() returns current state without consuming permits", () => {
  const now = 0;
  using limiter = createRateLimiter({
    limit: 5,
    window: 1000,
    algorithm: "fixed-window",
    evictionTtl: 0,
    clock: () => now,
  });

  limiter.limit("a");
  limiter.limit("a");

  const p = limiter.peek("a");
  assert(p.ok);
  assertEquals(p.remaining, 3);

  // peek didn't consume — still 3 remaining
  assertEquals(limiter.peek("a").remaining, 3);
});

Deno.test("peek() returns full capacity for unknown key", () => {
  const now = 0;
  using limiter = createRateLimiter({
    limit: 10,
    window: 1000,
    algorithm: "gcra",
    evictionTtl: 0,
    clock: () => now,
  });

  const p = limiter.peek("unknown");
  assert(p.ok);
  assertEquals(p.remaining, 10);
  assertEquals(p.limit, 10);
});

Deno.test("peek() reflects consumed permits after limit()", () => {
  const now = 0;
  using limiter = createRateLimiter({
    limit: 5,
    window: 1000,
    algorithm: "token-bucket",
    evictionTtl: 0,
    clock: () => now,
  });

  limiter.limit("a", { cost: 3 });
  const p = limiter.peek("a");
  assert(p.ok);
  assertEquals(p.remaining, 2);
});

// === reset() ===

Deno.test("reset() restores key to full capacity", () => {
  const now = 0;
  using limiter = createRateLimiter({
    limit: 3,
    window: 1000,
    algorithm: "gcra",
    evictionTtl: 0,
    clock: () => now,
  });

  limiter.limit("a", { cost: 3 });
  assertFalse(limiter.limit("a").ok);

  limiter.reset("a");
  assert(limiter.limit("a").ok);
});

Deno.test("reset() on unknown key is a no-op", () => {
  const now = 0;
  using limiter = createRateLimiter({
    limit: 5,
    window: 1000,
    algorithm: "fixed-window",
    evictionTtl: 0,
    clock: () => now,
  });

  limiter.reset("nonexistent"); // should not throw
});

// === size ===

Deno.test("size tracks number of keys", () => {
  const now = 0;
  using limiter = createRateLimiter({
    limit: 5,
    window: 1000,
    algorithm: "gcra",
    evictionTtl: 0,
    clock: () => now,
  });

  assertEquals(limiter.size, 0);
  limiter.limit("a");
  assertEquals(limiter.size, 1);
  limiter.limit("b");
  assertEquals(limiter.size, 2);
  limiter.limit("a"); // same key
  assertEquals(limiter.size, 2);
  limiter.reset("a");
  assertEquals(limiter.size, 1);
});

// === Eviction ===

Deno.test("keys are evicted after evictionTtl of inactivity", () => {
  using time = new FakeTime();
  using limiter = createRateLimiter({
    limit: 5,
    window: 1000,
    algorithm: "fixed-window",
    evictionTtl: 5000,
    evictionInterval: 1000,
  });

  limiter.limit("a");
  limiter.limit("b");
  assertEquals(limiter.size, 2);

  time.tick(6000);
  assertEquals(limiter.size, 0);
});

Deno.test("active keys are not evicted", () => {
  using time = new FakeTime();
  using limiter = createRateLimiter({
    limit: 5,
    window: 1000,
    algorithm: "fixed-window",
    evictionTtl: 5000,
    evictionInterval: 1000,
  });

  limiter.limit("a");
  limiter.limit("b");

  time.tick(4000);
  limiter.limit("a"); // refresh "a"

  time.tick(2000); // 6s total — "b" should be evicted, "a" should survive
  assertEquals(limiter.size, 1);
  assert(limiter.peek("a").ok);
});

Deno.test("peek() does not refresh activity for TTL eviction", () => {
  using time = new FakeTime();
  using limiter = createRateLimiter({
    limit: 5,
    window: 1000,
    algorithm: "fixed-window",
    evictionTtl: 5000,
    evictionInterval: 1000,
  });

  limiter.limit("a");
  assertEquals(limiter.size, 1);

  time.tick(4000);
  limiter.peek("a"); // should NOT refresh last-access

  time.tick(2000); // 6s total — "a" should be evicted despite the peek
  assertEquals(limiter.size, 0);
});

Deno.test("evictionTtl: 0 disables eviction", () => {
  using time = new FakeTime();
  using limiter = createRateLimiter({
    limit: 5,
    window: 1000,
    algorithm: "fixed-window",
    evictionTtl: 0,
  });

  limiter.limit("a");
  time.tick(1_000_000);
  assertEquals(limiter.size, 1);
});

// === Disposal ===

Deno.test("dispose clears all state", () => {
  using _time = new FakeTime();
  const limiter = createRateLimiter({
    limit: 5,
    window: 1000,
    algorithm: "gcra",
  });

  limiter.limit("a");
  limiter.limit("b");
  assertEquals(limiter.size, 2);

  limiter[Symbol.dispose]();
  assertEquals(limiter.size, 0);
});

Deno.test("limit() returns ok: false after disposal", () => {
  using _time = new FakeTime();
  const limiter = createRateLimiter({
    limit: 5,
    window: 1000,
    algorithm: "gcra",
  });

  limiter[Symbol.dispose]();
  const r = limiter.limit("a");
  assertFalse(r.ok);
  assertEquals(r.remaining, 0);
  assertEquals(r.resetAt, 0);
  assertEquals(r.retryAfter, 0);
});

Deno.test("peek() returns ok: false after disposal", () => {
  using _time = new FakeTime();
  const limiter = createRateLimiter({
    limit: 5,
    window: 1000,
    algorithm: "gcra",
  });

  limiter[Symbol.dispose]();
  const r = limiter.peek("a");
  assertFalse(r.ok);
  assertEquals(r.remaining, 0);
  assertEquals(r.resetAt, 0);
  assertEquals(r.retryAfter, 0);
});

Deno.test("reset() is a no-op after disposal", () => {
  using _time = new FakeTime();
  const limiter = createRateLimiter({
    limit: 5,
    window: 1000,
    algorithm: "gcra",
  });

  limiter[Symbol.dispose]();
  limiter.reset("a"); // should not throw
});

// === Metadata correctness ===

Deno.test("result.limit matches configured value", () => {
  const now = 0;
  using limiter = createRateLimiter({
    limit: 42,
    window: 1000,
    algorithm: "gcra",
    evictionTtl: 0,
    clock: () => now,
  });

  assertEquals(limiter.limit("a").limit, 42);
  assertEquals(limiter.peek("a").limit, 42);
});

Deno.test("retryAfter is 0 when allowed, positive when denied", () => {
  const now = 0;
  using limiter = createRateLimiter({
    limit: 1,
    window: 1000,
    algorithm: "fixed-window",
    evictionTtl: 0,
    clock: () => now,
  });

  const allowed = limiter.limit("a");
  assertEquals(allowed.retryAfter, 0);

  const denied = limiter.limit("a");
  assert(denied.retryAfter > 0);
});

Deno.test("resetAt is a future timestamp", () => {
  const now = 5000;
  using limiter = createRateLimiter({
    limit: 5,
    window: 1000,
    algorithm: "fixed-window",
    evictionTtl: 0,
    clock: () => now,
  });

  const r = limiter.limit("a");
  assert(r.resetAt > now);
});

Deno.test("gcra: retryAfter when now < allowAt (request arrives too early)", () => {
  let now = 0;
  using limiter = createRateLimiter({
    limit: 5,
    window: 1000,
    algorithm: "gcra",
    evictionTtl: 0,
    clock: () => now,
  });

  // Fill all 5 slots: tat advances to 1000
  for (let i = 0; i < 5; i++) limiter.limit("a");

  // Advance only 100ms — tat is 1000, allowAt = tat - tau = 0.
  // A request at now=100 is after allowAt, so this exercises the else branch.
  now = 100;
  const r1 = limiter.limit("a");
  assertFalse(r1.ok);
  assert(r1.retryAfter > 0);

  // Now set now to -100 (simulating clock skew) — now < allowAt exercises
  // the `now < allowAt` branch in result().
  now = -100;
  const r2 = limiter.peek("a");
  assertFalse(r2.ok);
  assert(r2.retryAfter > 0);
});

// === Per-key isolation ===

Deno.test("keys are isolated from each other", () => {
  const now = 0;
  using limiter = createRateLimiter({
    limit: 2,
    window: 1000,
    algorithm: "gcra",
    evictionTtl: 0,
    clock: () => now,
  });

  limiter.limit("a", { cost: 2 });
  assertFalse(limiter.limit("a").ok);

  assert(limiter.limit("b").ok);
  assert(limiter.limit("b").ok);
});

// === Default algorithm is sliding-window ===

Deno.test("default algorithm is sliding-window", () => {
  let now = 0;
  using limiter = createRateLimiter({
    limit: 10,
    window: 1000,
    evictionTtl: 0,
    clock: () => now,
  });

  limiter.limit("a", { cost: 10 });

  // At half-window, a fixed window would have reset. Sliding window hasn't.
  now = 500;
  assertFalse(limiter.limit("a").ok);

  // After full window, sliding window frees permits.
  now = 1000;
  assert(limiter.limit("a").ok);
});

// === Default clock uses Date.now (T-1 test) ===

Deno.test("default clock uses Date.now", () => {
  using _time = new FakeTime(0);
  using limiter = createRateLimiter({
    limit: 5,
    window: 1000,
    algorithm: "fixed-window",
  });

  const r = limiter.limit("a");
  assert(r.ok);
  assertEquals(r.resetAt, 1000);
});

// === peek() with cost (C-2/A-2) ===

Deno.test("peek() with cost checks whether that cost would be allowed", () => {
  const now = 0;
  using limiter = createRateLimiter({
    limit: 5,
    window: 1000,
    algorithm: "fixed-window",
    evictionTtl: 0,
    clock: () => now,
  });

  limiter.limit("a", { cost: 3 });

  assert(limiter.peek("a", { cost: 2 }).ok);
  assertFalse(limiter.peek("a", { cost: 3 }).ok);
});

Deno.test("peek() validates cost", () => {
  using _time = new FakeTime();
  using limiter = createRateLimiter({ limit: 10, window: 1000 });

  assertThrows(() => limiter.peek("a", { cost: 0 }), RangeError, "cost");
  assertThrows(() => limiter.peek("a", { cost: -1 }), RangeError, "cost");
  assertThrows(() => limiter.peek("a", { cost: 1.5 }), RangeError, "cost");
  assertThrows(() => limiter.peek("a", { cost: 11 }), RangeError, "exceeds");
});

// === maxKeys (S-1) ===

Deno.test("maxKeys rejects new keys when limit reached", () => {
  const now = 0;
  using limiter = createRateLimiter({
    limit: 5,
    window: 1000,
    algorithm: "gcra",
    evictionTtl: 0,
    maxKeys: 2,
    clock: () => now,
  });

  assert(limiter.limit("a").ok);
  assert(limiter.limit("b").ok);
  assertEquals(limiter.size, 2);

  const r = limiter.limit("c");
  assertFalse(r.ok);
  assertEquals(limiter.size, 2);
});

Deno.test("maxKeys allows existing keys even when at capacity", () => {
  const now = 0;
  using limiter = createRateLimiter({
    limit: 5,
    window: 1000,
    algorithm: "gcra",
    evictionTtl: 0,
    maxKeys: 2,
    clock: () => now,
  });

  limiter.limit("a");
  limiter.limit("b");

  const r = limiter.limit("a");
  assert(r.ok);
});

Deno.test("maxKeys: 0 disables key limit", () => {
  const now = 0;
  using limiter = createRateLimiter({
    limit: 100,
    window: 1000,
    algorithm: "gcra",
    evictionTtl: 0,
    maxKeys: 0,
    clock: () => now,
  });

  for (let i = 0; i < 1000; i++) {
    assert(limiter.limit(`key:${i}`).ok);
  }
  assertEquals(limiter.size, 1000);
});

Deno.test("createRateLimiter() throws for invalid maxKeys", () => {
  assertThrows(
    () => createRateLimiter({ limit: 10, window: 1000, maxKeys: -1 }),
    RangeError,
    "maxKeys",
  );
  assertThrows(
    () => createRateLimiter({ limit: 10, window: 1000, maxKeys: 1.5 }),
    RangeError,
    "maxKeys",
  );
});

Deno.test("maxKeys rejects peek for unknown key when at capacity", () => {
  const now = 0;
  using limiter = createRateLimiter({
    limit: 5,
    window: 1000,
    algorithm: "gcra",
    evictionTtl: 0,
    maxKeys: 2,
    clock: () => now,
  });

  limiter.limit("a");
  limiter.limit("b");

  const r = limiter.peek("c");
  assertFalse(r.ok);
  assertEquals(r.remaining, 0);
  assertEquals(r.retryAfter, 0);
  assertEquals(limiter.size, 2);
});

Deno.test("maxKeys allows peek for existing key at capacity", () => {
  const now = 0;
  using limiter = createRateLimiter({
    limit: 5,
    window: 1000,
    algorithm: "gcra",
    evictionTtl: 0,
    maxKeys: 2,
    clock: () => now,
  });

  limiter.limit("a");
  limiter.limit("b");

  const r = limiter.peek("a");
  assert(r.ok);
  assertEquals(r.remaining, 4);
});

// === maxKeys + window reset (C-1 regression) ===

Deno.test("maxKeys allows existing key whose window has reset", () => {
  let now = 0;
  using limiter = createRateLimiter({
    limit: 3,
    window: 1000,
    algorithm: "fixed-window",
    evictionTtl: 0,
    maxKeys: 2,
    clock: () => now,
  });

  limiter.limit("a");
  limiter.limit("b");
  assertEquals(limiter.size, 2);

  // Advance past the window so "a" resets to full capacity
  now = 2000;
  const r = limiter.limit("a");
  assert(r.ok);
  assertEquals(r.remaining, 2);
});

Deno.test("maxKeys allows GCRA key after full tat drain", () => {
  let now = 0;
  using limiter = createRateLimiter({
    limit: 5,
    window: 1000,
    algorithm: "gcra",
    evictionTtl: 0,
    maxKeys: 2,
    clock: () => now,
  });

  limiter.limit("a");
  limiter.limit("b");

  // Advance well past the window so "a" drains fully
  now = 5000;
  const r = limiter.limit("a");
  assert(r.ok);
});

// === peek() unknown key with cost > 1 (T-TEST-3) ===

Deno.test("peek() returns ok for unknown key with cost <= limit", () => {
  const now = 0;
  using limiter = createRateLimiter({
    limit: 10,
    window: 1000,
    algorithm: "fixed-window",
    evictionTtl: 0,
    clock: () => now,
  });

  const p = limiter.peek("unknown", { cost: 5 });
  assert(p.ok);
  assertEquals(p.remaining, 10);
  assertEquals(p.limit, 10);
});

Deno.test("peek() returns not-ok for unknown key with cost > limit", () => {
  const now = 0;
  using limiter = createRateLimiter({
    limit: 5,
    window: 1000,
    algorithm: "gcra",
    evictionTtl: 0,
    clock: () => now,
  });

  assertThrows(
    () => limiter.peek("unknown", { cost: 6 }),
    RangeError,
    "exceeds",
  );
});

// === Unknown algorithm (T-TEST-4) ===

Deno.test("createRateLimiter() throws for unknown algorithm", () => {
  assertThrows(
    () =>
      createRateLimiter({
        limit: 10,
        window: 1000,
        algorithm: "unknown" as "fixed-window",
      }),
    TypeError,
    "unknown",
  );
});

// === segmentsPerWindow edge cases in createRateLimiter (T-TEST-5) ===

Deno.test("createRateLimiter() throws for segmentsPerWindow: 0", () => {
  assertThrows(
    () =>
      createRateLimiter({
        limit: 10,
        window: 1000,
        algorithm: "sliding-window",
        segmentsPerWindow: 0,
      }),
    RangeError,
    "segmentsPerWindow",
  );
});

Deno.test("createRateLimiter() throws for non-integer segmentsPerWindow", () => {
  assertThrows(
    () =>
      createRateLimiter({
        limit: 10,
        window: 1000,
        algorithm: "sliding-window",
        segmentsPerWindow: 2.5,
      }),
    RangeError,
    "segmentsPerWindow",
  );
});
