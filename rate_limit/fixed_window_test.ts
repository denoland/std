// Copyright 2018-2026 the Deno authors. MIT license.

import {
  assert,
  assertEquals,
  assertFalse,
  assertRejects,
  assertThrows,
} from "@std/assert";
import { FakeTime } from "@std/testing/time";
import { createFixedWindow } from "./fixed_window.ts";

// --- Factory validation ---

Deno.test("createFixedWindow() throws for invalid limit", () => {
  assertThrows(
    () => createFixedWindow({ limit: 0, window: 1000 }),
    RangeError,
    "limit",
  );
  assertThrows(
    () => createFixedWindow({ limit: -1, window: 1000 }),
    RangeError,
    "limit",
  );
  assertThrows(
    () => createFixedWindow({ limit: 1.5, window: 1000 }),
    RangeError,
    "limit",
  );
  assertThrows(
    () => createFixedWindow({ limit: NaN, window: 1000 }),
    RangeError,
    "limit",
  );
  assertThrows(
    () => createFixedWindow({ limit: Infinity, window: 1000 }),
    RangeError,
    "limit",
  );
});

Deno.test("createFixedWindow() throws for invalid window", () => {
  assertThrows(
    () => createFixedWindow({ limit: 10, window: 0 }),
    RangeError,
    "window",
  );
  assertThrows(
    () => createFixedWindow({ limit: 10, window: -100 }),
    RangeError,
    "window",
  );
  assertThrows(
    () => createFixedWindow({ limit: 10, window: NaN }),
    RangeError,
    "window",
  );
  assertThrows(
    () => createFixedWindow({ limit: 10, window: Infinity }),
    RangeError,
    "window",
  );
});

Deno.test("createFixedWindow() throws for invalid queueLimit", () => {
  assertThrows(
    () => createFixedWindow({ limit: 10, window: 1000, queueLimit: -1 }),
    RangeError,
    "queueLimit",
  );
});

Deno.test("createFixedWindow() throws for unknown queueOrder", () => {
  assertThrows(
    () =>
      createFixedWindow({
        limit: 10,
        window: 1000,
        queueOrder: "random" as "oldest-first",
      }),
    TypeError,
    "unknown queueOrder",
  );
});

// --- tryAcquire ---

Deno.test("tryAcquire() succeeds within the window limit", () => {
  using time = new FakeTime(0);
  using limiter = createFixedWindow({
    limit: 3,
    window: 1000,
  });
  void time;

  assert(limiter.tryAcquire().acquired);
  assert(limiter.tryAcquire().acquired);
  assert(limiter.tryAcquire().acquired);
  assertFalse(limiter.tryAcquire().acquired);
});

Deno.test("tryAcquire() acquires multiple permits at once", () => {
  using time = new FakeTime(0);
  using limiter = createFixedWindow({
    limit: 5,
    window: 1000,
  });
  void time;

  assert(limiter.tryAcquire(3).acquired);
  assertFalse(limiter.tryAcquire(3).acquired);
  assert(limiter.tryAcquire(2).acquired);
});

Deno.test("tryAcquire() rejects with retryAfter equal to window duration", () => {
  using time = new FakeTime(0);
  using limiter = createFixedWindow({
    limit: 1,
    window: 5000,
  });
  void time;

  limiter.tryAcquire();
  const lease = limiter.tryAcquire();
  assertFalse(lease.acquired);
  assertEquals(lease.retryAfter, 5000);
});

Deno.test("tryAcquire() throws for invalid permits", () => {
  using time = new FakeTime(0);
  using limiter = createFixedWindow({
    limit: 5,
    window: 1000,
  });
  void time;

  assertThrows(() => limiter.tryAcquire(0), RangeError);
  assertThrows(() => limiter.tryAcquire(-1), RangeError);
  assertThrows(() => limiter.tryAcquire(1.5), RangeError);
});

Deno.test("tryAcquire() throws when permits exceed limit", () => {
  using time = new FakeTime(0);
  using limiter = createFixedWindow({
    limit: 5,
    window: 1000,
  });
  void time;

  assertThrows(() => limiter.tryAcquire(6), RangeError, "exceeds");
});

// --- Window reset ---

Deno.test("permits reset after the window elapses", () => {
  using time = new FakeTime(0);
  using limiter = createFixedWindow({ limit: 2, window: 1000 });

  limiter.tryAcquire();
  limiter.tryAcquire();
  assertFalse(limiter.tryAcquire().acquired);

  time.tick(1000);

  assert(limiter.tryAcquire().acquired);
  assert(limiter.tryAcquire().acquired);
  assertFalse(limiter.tryAcquire().acquired);
});

Deno.test("full permit count is restored each window", () => {
  using time = new FakeTime(0);
  using limiter = createFixedWindow({ limit: 5, window: 500 });

  for (let i = 0; i < 5; i++) limiter.tryAcquire();
  assertFalse(limiter.tryAcquire().acquired);

  time.tick(500);

  assert(limiter.tryAcquire(5).acquired);
});

// --- Manual replenishment ---

Deno.test("replenish() throws when autoReplenishment is true", () => {
  using time = new FakeTime(0);
  using limiter = createFixedWindow({
    limit: 5,
    window: 1000,
  });
  void time;

  assertThrows(
    () => limiter.replenish(),
    Error,
    "Cannot replenish: limiter uses automatic replenishment",
  );
});

Deno.test("replenish() drains queued acquire() waiters", async () => {
  const limiter = createFixedWindow({
    limit: 3,
    window: 1000,
    autoReplenishment: false,
    queueLimit: 5,
  });

  limiter.tryAcquire(3);

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

Deno.test("replenish() resets the window when autoReplenishment is false", () => {
  const limiter = createFixedWindow({
    limit: 3,
    window: 1000,
    autoReplenishment: false,
  });

  limiter.tryAcquire();
  limiter.tryAcquire();
  limiter.tryAcquire();
  assertFalse(limiter.tryAcquire().acquired);

  limiter.replenish();
  assert(limiter.tryAcquire().acquired);

  limiter[Symbol.dispose]();
});

// --- acquire (async) ---

Deno.test("acquire() resolves immediately when permits available", async () => {
  using time = new FakeTime(0);
  using limiter = createFixedWindow({ limit: 5, window: 1000 });
  void time;

  const lease = await limiter.acquire();
  assert(lease.acquired);
});

Deno.test("acquire() returns rejected lease when queue limit is 0", async () => {
  using time = new FakeTime(0);
  using limiter = createFixedWindow({
    limit: 1,
    window: 1000,
    queueLimit: 0,
  });
  void time;

  limiter.tryAcquire();
  const lease = await limiter.acquire();
  assertFalse(lease.acquired);
  assertEquals(lease.reason, "Queue limit exceeded");
});

Deno.test("acquire() queues and resolves after window reset", async () => {
  using time = new FakeTime(0);
  using limiter = createFixedWindow({
    limit: 1,
    window: 1000,
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
  using limiter = createFixedWindow({
    limit: 1,
    window: 1000,
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
  using limiter = createFixedWindow({
    limit: 1,
    window: 1000,
    queueLimit: 5,
  });
  void time;

  limiter.tryAcquire();

  await assertRejects(
    () => limiter.acquire(1, { signal: AbortSignal.abort() }),
    DOMException,
  );
});

Deno.test("acquire() with already-aborted signal rejects even when permits are available", async () => {
  using time = new FakeTime(0);
  using limiter = createFixedWindow({
    limit: 5,
    window: 1000,
    queueLimit: 5,
  });
  void time;

  await assertRejects(
    () => limiter.acquire(1, { signal: AbortSignal.abort() }),
    DOMException,
  );

  assert(
    limiter.tryAcquire(5).acquired,
    "all 5 permits should still be available",
  );
});

Deno.test("acquire() with already-aborted signal does not evict queued waiters", async () => {
  using time = new FakeTime(0);
  using limiter = createFixedWindow({
    limit: 1,
    window: 1000,
    queueLimit: 1,
    queueOrder: "newest-first",
  });

  limiter.tryAcquire();

  const existingPromise = limiter.acquire();

  await assertRejects(
    () => limiter.acquire(1, { signal: AbortSignal.abort() }),
    DOMException,
  );

  time.tick(1000);
  const lease = await existingPromise;
  assert(lease.acquired, "existing waiter should not have been evicted");
});

// --- Disposal ---

Deno.test("dispose resolves queued waiters with rejected leases", async () => {
  using time = new FakeTime(0);
  const limiter = createFixedWindow({
    limit: 1,
    window: 1000,
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
  const limiter = createFixedWindow({ limit: 5, window: 1000 });
  void time;

  limiter[Symbol.dispose]();
  const lease = limiter.tryAcquire();
  assertFalse(lease.acquired);
});

Deno.test("acquire() rejects after disposal", async () => {
  using time = new FakeTime(0);
  const limiter = createFixedWindow({ limit: 5, window: 1000 });
  void time;

  limiter[Symbol.dispose]();
  await assertRejects(() => limiter.acquire(), Error, "disposed");
});

// --- Queue ordering ---

Deno.test("oldest-first queue resolves waiters in FIFO order", async () => {
  using time = new FakeTime(0);
  using limiter = createFixedWindow({
    limit: 1,
    window: 1000,
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
  using limiter = createFixedWindow({
    limit: 1,
    window: 1000,
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

// --- Eviction ---

Deno.test("newest-first queue evicts oldest waiter when queue is full", async () => {
  using time = new FakeTime(0);
  using limiter = createFixedWindow({
    limit: 1,
    window: 1000,
    queueLimit: 2,
    queueOrder: "newest-first",
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
  const p3 = limiter.acquire().then((l) => {
    results.push(l.acquired ? "p3:acquired" : `p3:${l.reason}`);
    return l;
  });

  await p1;
  assertEquals(results, ["p1:Evicted by newer request"]);

  time.tick(1000);
  await p3;
  time.tick(1000);
  await p2;

  assertEquals(results, [
    "p1:Evicted by newer request",
    "p3:acquired",
    "p2:acquired",
  ]);
});

Deno.test("oldest-first queue evicts oldest waiter when queue is full", async () => {
  using time = new FakeTime(0);
  using limiter = createFixedWindow({
    limit: 1,
    window: 1000,
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

// --- Multi-permit queued waiters ---

Deno.test("acquire() queues multi-permit waiter spanning multiple windows", async () => {
  using time = new FakeTime(0);
  using limiter = createFixedWindow({
    limit: 2,
    window: 1000,
    queueLimit: 10,
  });

  limiter.tryAcquire(2);

  let resolved = false;
  const promise = limiter.acquire(2).then((lease) => {
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

// --- Multiple waiters resolved in single replenishment ---

Deno.test("single replenishment resolves multiple queued waiters", async () => {
  using time = new FakeTime(0);
  using limiter = createFixedWindow({
    limit: 3,
    window: 1000,
    queueLimit: 10,
  });

  limiter.tryAcquire(3);

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
  using limiter = createFixedWindow({ limit: 5, window: 1000 });
  void time;

  await assertRejects(() => limiter.acquire(0), RangeError);
  await assertRejects(() => limiter.acquire(-1), RangeError);
  await assertRejects(() => limiter.acquire(1.5), RangeError);
});

Deno.test("acquire() rejects when permits exceed limit", async () => {
  using time = new FakeTime(0);
  using limiter = createFixedWindow({ limit: 5, window: 1000 });
  void time;

  await assertRejects(() => limiter.acquire(6), RangeError, "exceeds");
});

// --- Double dispose ---

Deno.test("double dispose is a no-op", () => {
  using time = new FakeTime(0);
  const limiter = createFixedWindow({ limit: 5, window: 1000 });
  void time;

  limiter[Symbol.dispose]();
  limiter[Symbol.dispose]();
});

Deno.test("replenish() after dispose is a no-op", () => {
  const limiter = createFixedWindow({
    limit: 5,
    window: 1000,
    autoReplenishment: false,
  });

  limiter[Symbol.dispose]();
  limiter.replenish();
});

// --- Lease disposal ---

Deno.test("acquired lease is disposable", () => {
  using time = new FakeTime(0);
  using limiter = createFixedWindow({ limit: 5, window: 1000 });
  void time;

  {
    using lease = limiter.tryAcquire();
    assert(lease.acquired);
  }
});

Deno.test("rejected lease is disposable", () => {
  using time = new FakeTime(0);
  using limiter = createFixedWindow({ limit: 1, window: 1000 });
  void time;

  assert(limiter.tryAcquire().acquired);
  {
    using lease = limiter.tryAcquire();
    assertFalse(lease.acquired);
  }
});

// --- Signal cleanup on normal drain ---

Deno.test("queued waiter with non-aborted signal is drained cleanly", async () => {
  using time = new FakeTime(0);
  using limiter = createFixedWindow({
    limit: 1,
    window: 1000,
    queueLimit: 5,
  });

  limiter.tryAcquire();

  const controller = new AbortController();
  const promise = limiter.acquire(1, { signal: controller.signal });

  time.tick(1000);
  const lease = await promise;
  assert(lease.acquired);

  controller.abort();
});
