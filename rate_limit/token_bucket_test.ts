// Copyright 2018-2026 the Deno authors. MIT license.

import {
  assert,
  assertEquals,
  assertFalse,
  assertRejects,
  assertThrows,
} from "@std/assert";
import { FakeTime } from "@std/testing/time";
import { createTokenBucket } from "./token_bucket.ts";

// --- Factory validation ---

Deno.test("createTokenBucket() throws for invalid tokenLimit", () => {
  assertThrows(
    () =>
      createTokenBucket({
        tokenLimit: 0,
        tokensPerPeriod: 1,
        replenishmentPeriod: 1000,
      }),
    RangeError,
    "tokenLimit",
  );
  assertThrows(
    () =>
      createTokenBucket({
        tokenLimit: -1,
        tokensPerPeriod: 1,
        replenishmentPeriod: 1000,
      }),
    RangeError,
    "tokenLimit",
  );
  assertThrows(
    () =>
      createTokenBucket({
        tokenLimit: 1.5,
        tokensPerPeriod: 1,
        replenishmentPeriod: 1000,
      }),
    RangeError,
    "tokenLimit",
  );
});

Deno.test("createTokenBucket() throws for invalid tokensPerPeriod", () => {
  assertThrows(
    () =>
      createTokenBucket({
        tokenLimit: 10,
        tokensPerPeriod: 0,
        replenishmentPeriod: 1000,
      }),
    RangeError,
    "tokensPerPeriod",
  );
});

Deno.test("createTokenBucket() throws for invalid replenishmentPeriod", () => {
  assertThrows(
    () =>
      createTokenBucket({
        tokenLimit: 10,
        tokensPerPeriod: 1,
        replenishmentPeriod: 0,
      }),
    RangeError,
    "replenishmentPeriod",
  );
  assertThrows(
    () =>
      createTokenBucket({
        tokenLimit: 10,
        tokensPerPeriod: 1,
        replenishmentPeriod: -100,
      }),
    RangeError,
    "replenishmentPeriod",
  );
});

Deno.test("createTokenBucket() throws when tokensPerPeriod exceeds tokenLimit", () => {
  assertThrows(
    () =>
      createTokenBucket({
        tokenLimit: 5,
        tokensPerPeriod: 10,
        replenishmentPeriod: 1000,
      }),
    RangeError,
    "tokensPerPeriod",
  );
});

Deno.test("createTokenBucket() throws for invalid queueLimit", () => {
  assertThrows(
    () =>
      createTokenBucket({
        tokenLimit: 10,
        tokensPerPeriod: 1,
        replenishmentPeriod: 1000,
        queueLimit: -1,
      }),
    RangeError,
    "queueLimit",
  );
});

// --- tryAcquire ---

Deno.test("tryAcquire() succeeds when tokens are available", () => {
  using time = new FakeTime(0);
  using limiter = createTokenBucket({
    tokenLimit: 5,
    tokensPerPeriod: 1,
    replenishmentPeriod: 1000,
  });
  void time;

  const lease = limiter.tryAcquire();
  assert(lease.acquired);
});

Deno.test("tryAcquire() acquires multiple permits", () => {
  using time = new FakeTime(0);
  using limiter = createTokenBucket({
    tokenLimit: 5,
    tokensPerPeriod: 1,
    replenishmentPeriod: 1000,
  });
  void time;

  const lease = limiter.tryAcquire(3);
  assert(lease.acquired);

  const lease2 = limiter.tryAcquire(3);
  assertFalse(lease2.acquired);
});

Deno.test("tryAcquire() returns rejected lease when tokens exhausted", () => {
  using time = new FakeTime(0);
  using limiter = createTokenBucket({
    tokenLimit: 1,
    tokensPerPeriod: 1,
    replenishmentPeriod: 1000,
  });
  void time;

  const first = limiter.tryAcquire();
  assert(first.acquired);

  const second = limiter.tryAcquire();
  assertFalse(second.acquired);
  assert(second.retryAfter > 0);
  assertEquals(second.reason, "Insufficient permits");
});

Deno.test("tryAcquire() throws for invalid permits", () => {
  using time = new FakeTime(0);
  using limiter = createTokenBucket({
    tokenLimit: 5,
    tokensPerPeriod: 1,
    replenishmentPeriod: 1000,
  });
  void time;

  assertThrows(() => limiter.tryAcquire(0), RangeError);
  assertThrows(() => limiter.tryAcquire(-1), RangeError);
  assertThrows(() => limiter.tryAcquire(1.5), RangeError);
});

Deno.test("tryAcquire() throws when permits exceed tokenLimit", () => {
  using time = new FakeTime(0);
  using limiter = createTokenBucket({
    tokenLimit: 5,
    tokensPerPeriod: 1,
    replenishmentPeriod: 1000,
  });
  void time;

  assertThrows(() => limiter.tryAcquire(6), RangeError, "exceeds");
});

// --- Replenishment ---

Deno.test("tokens replenish after the configured period", () => {
  using time = new FakeTime(0);
  using limiter = createTokenBucket({
    tokenLimit: 2,
    tokensPerPeriod: 1,
    replenishmentPeriod: 1000,
  });

  limiter.tryAcquire();
  limiter.tryAcquire();
  assertFalse(limiter.tryAcquire().acquired);

  time.tick(1000);
  assert(limiter.tryAcquire().acquired);
});

Deno.test("tokens do not exceed tokenLimit after replenishment", () => {
  using time = new FakeTime(0);
  using limiter = createTokenBucket({
    tokenLimit: 2,
    tokensPerPeriod: 2,
    replenishmentPeriod: 1000,
  });

  time.tick(5000);

  assert(limiter.tryAcquire(2).acquired);
  assertFalse(limiter.tryAcquire().acquired);
});

// --- Manual replenishment ---

Deno.test("replenish() throws when autoReplenishment is true", () => {
  using time = new FakeTime(0);
  using limiter = createTokenBucket({
    tokenLimit: 5,
    tokensPerPeriod: 1,
    replenishmentPeriod: 1000,
  });
  void time;

  assertThrows(
    () => limiter.replenish(),
    Error,
    "Cannot replenish: limiter uses automatic replenishment",
  );
});

Deno.test("replenish() replenishes when autoReplenishment is false", () => {
  const limiter = createTokenBucket({
    tokenLimit: 5,
    tokensPerPeriod: 2,
    replenishmentPeriod: 1000,
    autoReplenishment: false,
  });

  for (let i = 0; i < 5; i++) limiter.tryAcquire();
  assertFalse(limiter.tryAcquire().acquired);

  limiter.replenish();
  assert(limiter.tryAcquire().acquired);
  assert(limiter.tryAcquire().acquired);
  assertFalse(limiter.tryAcquire().acquired);

  limiter[Symbol.dispose]();
});

Deno.test("replenish() drains queued acquire() waiters", async () => {
  const limiter = createTokenBucket({
    tokenLimit: 2,
    tokensPerPeriod: 2,
    replenishmentPeriod: 1000,
    autoReplenishment: false,
    queueLimit: 5,
  });

  limiter.tryAcquire(2);

  let resolved = false;
  const promise = limiter.acquire().then((lease) => {
    resolved = true;
    return lease;
  });

  await Promise.resolve();
  assertFalse(resolved);

  limiter.replenish();
  const lease = await promise;
  assert(resolved);
  assert(lease.acquired);

  limiter[Symbol.dispose]();
});

// --- acquire (async) ---

Deno.test("acquire() resolves immediately when tokens available", async () => {
  using time = new FakeTime(0);
  using limiter = createTokenBucket({
    tokenLimit: 5,
    tokensPerPeriod: 1,
    replenishmentPeriod: 1000,
  });
  void time;

  const lease = await limiter.acquire();
  assert(lease.acquired);
});

Deno.test("acquire() returns rejected lease when queue limit is 0", async () => {
  using time = new FakeTime(0);
  using limiter = createTokenBucket({
    tokenLimit: 1,
    tokensPerPeriod: 1,
    replenishmentPeriod: 1000,
    queueLimit: 0,
  });
  void time;

  limiter.tryAcquire();
  const lease = await limiter.acquire();
  assertFalse(lease.acquired);
  assertEquals(lease.reason, "Queue limit exceeded");
});

Deno.test("acquire() queues and resolves after replenishment", async () => {
  using time = new FakeTime(0);
  using limiter = createTokenBucket({
    tokenLimit: 1,
    tokensPerPeriod: 1,
    replenishmentPeriod: 1000,
    queueLimit: 5,
  });

  limiter.tryAcquire();

  let resolved = false;
  const promise = limiter.acquire().then((lease) => {
    resolved = true;
    return lease;
  });

  await Promise.resolve();
  assertFalse(resolved);

  time.tick(1000);
  const lease = await promise;
  assert(resolved);
  assert(lease.acquired);
});

Deno.test("acquire() rejects when aborted via signal", async () => {
  using time = new FakeTime(0);
  using limiter = createTokenBucket({
    tokenLimit: 1,
    tokensPerPeriod: 1,
    replenishmentPeriod: 1000,
    queueLimit: 5,
  });
  void time;

  limiter.tryAcquire();

  const controller = new AbortController();
  const promise = limiter.acquire(1, { signal: controller.signal });
  controller.abort();

  await assertRejects(() => promise, DOMException);
});

Deno.test("acquire() rejects when signal is already aborted", async () => {
  using time = new FakeTime(0);
  using limiter = createTokenBucket({
    tokenLimit: 1,
    tokensPerPeriod: 1,
    replenishmentPeriod: 1000,
    queueLimit: 5,
  });
  void time;

  limiter.tryAcquire();

  await assertRejects(
    () => limiter.acquire(1, { signal: AbortSignal.abort() }),
    DOMException,
  );
});

// --- retryAfter ---

Deno.test("retryAfter reflects the deficit in tokens", () => {
  using time = new FakeTime(0);
  using limiter = createTokenBucket({
    tokenLimit: 10,
    tokensPerPeriod: 2,
    replenishmentPeriod: 500,
  });
  void time;

  for (let i = 0; i < 10; i++) limiter.tryAcquire();

  const lease = limiter.tryAcquire(3);
  assertFalse(lease.acquired);
  assertEquals(lease.retryAfter, 1000);
});

// --- Disposal ---

Deno.test("dispose resolves queued waiters with rejected leases", async () => {
  using time = new FakeTime(0);
  const limiter = createTokenBucket({
    tokenLimit: 1,
    tokensPerPeriod: 1,
    replenishmentPeriod: 1000,
    queueLimit: 5,
  });
  void time;

  limiter.tryAcquire();
  const promise = limiter.acquire();
  limiter[Symbol.dispose]();

  const lease = await promise;
  assertFalse(lease.acquired);
  assertEquals(lease.reason, "Rate limiter has been disposed");
});

Deno.test("tryAcquire() returns rejected lease after disposal", () => {
  using time = new FakeTime(0);
  const limiter = createTokenBucket({
    tokenLimit: 5,
    tokensPerPeriod: 1,
    replenishmentPeriod: 1000,
  });
  void time;

  limiter[Symbol.dispose]();
  const lease = limiter.tryAcquire();
  assertFalse(lease.acquired);
});

Deno.test("acquire() rejects after disposal", async () => {
  using time = new FakeTime(0);
  const limiter = createTokenBucket({
    tokenLimit: 5,
    tokensPerPeriod: 1,
    replenishmentPeriod: 1000,
  });
  void time;

  limiter[Symbol.dispose]();
  await assertRejects(() => limiter.acquire(), Error, "disposed");
});

// --- Queue ordering ---

Deno.test("oldest-first queue resolves waiters in FIFO order", async () => {
  using time = new FakeTime(0);
  using limiter = createTokenBucket({
    tokenLimit: 1,
    tokensPerPeriod: 1,
    replenishmentPeriod: 1000,
    queueLimit: 10,
    queueOrder: "oldest-first",
  });

  limiter.tryAcquire();

  const order: number[] = [];
  const p1 = limiter.acquire().then((l) => {
    order.push(1);
    return l;
  });
  const p2 = limiter.acquire().then((l) => {
    order.push(2);
    return l;
  });

  time.tick(1000);
  await p1;
  time.tick(1000);
  await p2;

  assertEquals(order, [1, 2]);
});

Deno.test("newest-first queue resolves newest waiter first", async () => {
  using time = new FakeTime(0);
  using limiter = createTokenBucket({
    tokenLimit: 1,
    tokensPerPeriod: 1,
    replenishmentPeriod: 1000,
    queueLimit: 10,
    queueOrder: "newest-first",
  });

  limiter.tryAcquire();

  const order: number[] = [];
  const p1 = limiter.acquire().then((l) => {
    order.push(1);
    return l;
  });
  const p2 = limiter.acquire().then((l) => {
    order.push(2);
    return l;
  });

  time.tick(1000);
  await p2;
  time.tick(1000);
  await p1;

  assertEquals(order, [2, 1]);
});

// --- Multi-permit queued waiters ---

Deno.test("acquire() queues multi-permit waiter spanning multiple periods", async () => {
  using time = new FakeTime(0);
  using limiter = createTokenBucket({
    tokenLimit: 3,
    tokensPerPeriod: 1,
    replenishmentPeriod: 1000,
    queueLimit: 10,
  });

  limiter.tryAcquire(3);

  let resolved = false;
  const promise = limiter.acquire(3).then((lease) => {
    resolved = true;
    return lease;
  });

  await Promise.resolve();
  assertFalse(resolved);

  time.tick(1000);
  await Promise.resolve();
  assertFalse(resolved);

  time.tick(1000);
  await Promise.resolve();
  assertFalse(resolved);

  time.tick(1000);
  const lease = await promise;
  assert(resolved);
  assert(lease.acquired);
});

// --- Multiple waiters resolved in single replenishment ---

Deno.test("single replenishment resolves multiple queued waiters", async () => {
  using time = new FakeTime(0);
  using limiter = createTokenBucket({
    tokenLimit: 5,
    tokensPerPeriod: 5,
    replenishmentPeriod: 1000,
    queueLimit: 10,
  });

  limiter.tryAcquire(5);

  const order: number[] = [];
  const p1 = limiter.acquire(1).then((l) => {
    order.push(1);
    return l;
  });
  const p2 = limiter.acquire(1).then((l) => {
    order.push(2);
    return l;
  });
  const p3 = limiter.acquire(1).then((l) => {
    order.push(3);
    return l;
  });

  await Promise.resolve();
  assertEquals(order, []);

  time.tick(1000);
  await Promise.all([p1, p2, p3]);

  assertEquals(order, [1, 2, 3]);
  for (const p of [p1, p2, p3]) {
    assert((await p).acquired);
  }
});

// --- acquire() validation ---

Deno.test("acquire() rejects for invalid permits", async () => {
  using time = new FakeTime(0);
  using limiter = createTokenBucket({
    tokenLimit: 5,
    tokensPerPeriod: 1,
    replenishmentPeriod: 1000,
  });
  void time;

  await assertRejects(() => limiter.acquire(0), RangeError);
  await assertRejects(() => limiter.acquire(-1), RangeError);
  await assertRejects(() => limiter.acquire(1.5), RangeError);
});

Deno.test("acquire() rejects when permits exceed tokenLimit", async () => {
  using time = new FakeTime(0);
  using limiter = createTokenBucket({
    tokenLimit: 5,
    tokensPerPeriod: 1,
    replenishmentPeriod: 1000,
  });
  void time;

  await assertRejects(() => limiter.acquire(6), RangeError, "exceeds");
});

// --- Queue edge cases ---

Deno.test("acquire() rejects when permits exceed queueLimit even if queue is empty", async () => {
  using time = new FakeTime(0);
  using limiter = createTokenBucket({
    tokenLimit: 5,
    tokensPerPeriod: 1,
    replenishmentPeriod: 1000,
    queueLimit: 2,
  });
  void time;

  for (let i = 0; i < 5; i++) limiter.tryAcquire();

  const lease = await limiter.acquire(3);
  assertFalse(lease.acquired);
  assertEquals(lease.reason, "Queue limit exceeded");
});

Deno.test("oldest-first queue evicts oldest waiter when queue is full", async () => {
  using time = new FakeTime(0);
  using limiter = createTokenBucket({
    tokenLimit: 1,
    tokensPerPeriod: 1,
    replenishmentPeriod: 1000,
    queueLimit: 1,
    queueOrder: "oldest-first",
  });

  limiter.tryAcquire();

  const results: string[] = [];
  const p1 = limiter.acquire().then((l) => {
    results.push(l.acquired ? "p1:acquired" : `p1:${l.reason}`);
    return l;
  });
  const p2 = limiter.acquire().then((l) => {
    results.push(l.acquired ? "p2:acquired" : `p2:${l.reason}`);
    return l;
  });

  await p1;
  assertEquals(results, ["p1:Evicted by newer request"]);

  time.tick(1000);
  await p2;

  assertEquals(results, ["p1:Evicted by newer request", "p2:acquired"]);
});

Deno.test("eviction evicts multiple waiters to make room for a large request", async () => {
  using time = new FakeTime(0);
  using limiter = createTokenBucket({
    tokenLimit: 3,
    tokensPerPeriod: 3,
    replenishmentPeriod: 1000,
    queueLimit: 3,
    queueOrder: "newest-first",
  });

  limiter.tryAcquire(3);

  const results: string[] = [];
  const p1 = limiter.acquire(1).then((l) => {
    results.push(l.acquired ? "p1:acquired" : `p1:${l.reason}`);
    return l;
  });
  const p2 = limiter.acquire(1).then((l) => {
    results.push(l.acquired ? "p2:acquired" : `p2:${l.reason}`);
    return l;
  });
  const p3 = limiter.acquire(1).then((l) => {
    results.push(l.acquired ? "p3:acquired" : `p3:${l.reason}`);
    return l;
  });

  await Promise.resolve();
  assertEquals(results, []);

  const p4 = limiter.acquire(3).then((l) => {
    results.push(l.acquired ? "p4:acquired" : `p4:${l.reason}`);
    return l;
  });

  await Promise.all([p1, p2, p3]);
  assertEquals(results, [
    "p1:Evicted by newer request",
    "p2:Evicted by newer request",
    "p3:Evicted by newer request",
  ]);

  time.tick(1000);
  const lease = await p4;
  assert(lease.acquired);
  assertEquals(results, [
    "p1:Evicted by newer request",
    "p2:Evicted by newer request",
    "p3:Evicted by newer request",
    "p4:acquired",
  ]);
});

// --- retryAfter after manual replenish ---

Deno.test("retryAfter is correct after manual replenish", () => {
  const limiter = createTokenBucket({
    tokenLimit: 3,
    tokensPerPeriod: 1,
    replenishmentPeriod: 1000,
    autoReplenishment: false,
  });

  for (let i = 0; i < 3; i++) limiter.tryAcquire();
  limiter.replenish();
  limiter.tryAcquire();

  const lease = limiter.tryAcquire(3);
  assertFalse(lease.acquired);
  assert(lease.retryAfter > 0);
  assert(Number.isFinite(lease.retryAfter));

  limiter[Symbol.dispose]();
});

// --- Floating-point boundary ---

Deno.test("remaining uses floor when tokens are at integer boundary", () => {
  using time = new FakeTime(0);
  using limiter = createTokenBucket({
    tokenLimit: 5,
    tokensPerPeriod: 1,
    replenishmentPeriod: 1000,
  });

  for (let i = 0; i < 5; i++) limiter.tryAcquire();
  assertFalse(limiter.tryAcquire().acquired);

  time.tick(1000);
  const lease = limiter.tryAcquire();
  assert(lease.acquired);
});

Deno.test("tryAcquire() denied at exact token boundary after partial refill", () => {
  using time = new FakeTime(0);
  using limiter = createTokenBucket({
    tokenLimit: 10,
    tokensPerPeriod: 3,
    replenishmentPeriod: 1000,
  });

  for (let i = 0; i < 10; i++) limiter.tryAcquire();
  assertFalse(limiter.tryAcquire().acquired);

  time.tick(1000);
  assert(limiter.tryAcquire(3).acquired);
  assertFalse(limiter.tryAcquire().acquired);

  time.tick(1000);
  assert(limiter.tryAcquire(3).acquired);
  assertFalse(limiter.tryAcquire().acquired);

  time.tick(1000);
  assert(limiter.tryAcquire(3).acquired);
  assertFalse(limiter.tryAcquire().acquired);
});

Deno.test("retryAfter is correct with non-power-of-two tokensPerPeriod", () => {
  using time = new FakeTime(0);
  using limiter = createTokenBucket({
    tokenLimit: 7,
    tokensPerPeriod: 3,
    replenishmentPeriod: 1000,
  });
  void time;

  for (let i = 0; i < 7; i++) limiter.tryAcquire();

  const lease = limiter.tryAcquire(5);
  assertFalse(lease.acquired);
  assertEquals(lease.retryAfter, 2000);
});

// --- Double dispose ---

Deno.test("double dispose is a no-op", () => {
  using time = new FakeTime(0);
  const limiter = createTokenBucket({
    tokenLimit: 5,
    tokensPerPeriod: 1,
    replenishmentPeriod: 1000,
  });
  void time;

  limiter[Symbol.dispose]();
  limiter[Symbol.dispose]();
});
