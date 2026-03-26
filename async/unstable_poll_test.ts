// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals, assertRejects } from "@std/assert";
import { poll } from "./unstable_poll.ts";
import { FakeTime } from "@std/testing/time";

Deno.test("poll() returns result when isDone returns true", async () => {
  let callCount = 0;
  const result = await poll(
    () => {
      callCount++;
      return { status: callCount >= 3 ? "done" : "pending" };
    },
    (r) => r.status === "done",
    { interval: 10 },
  );

  assertEquals(result, { status: "done" });
  assertEquals(callCount, 3);
});

Deno.test("poll() returns immediately when isDone returns true on first call", async () => {
  using time = new FakeTime();
  const startTime = time.now;

  const result = await poll(
    () => "immediate",
    () => true,
  );

  assertEquals(result, "immediate");
  assertEquals(time.now, startTime);
});

Deno.test("poll() works with async functions", async () => {
  let callCount = 0;
  const result = await poll(
    async () => {
      await Promise.resolve();
      return ++callCount;
    },
    (n) => n >= 3,
    { interval: 10 },
  );

  assertEquals(result, 3);
});

Deno.test("poll() respects interval timing", async () => {
  using time = new FakeTime();

  let callCount = 0;
  const promise = poll(
    () => ++callCount,
    (n) => n >= 4,
    { interval: 200 },
  );

  // First call is immediate
  await time.runMicrotasks();
  assertEquals(callCount, 1);

  // Advance through remaining calls
  await time.nextAsync();
  assertEquals(callCount, 2);

  await time.nextAsync();
  assertEquals(callCount, 3);

  await time.nextAsync();
  assertEquals(callCount, 4);

  await promise;
});

Deno.test("poll() handles abort signal", async () => {
  using time = new FakeTime();
  const controller = new AbortController();
  let callCount = 0;

  const promise = poll(
    () => ++callCount,
    () => false, // Never done
    { signal: controller.signal, interval: 10 },
  );

  // First call is immediate
  await time.runMicrotasks();
  assertEquals(callCount, 1);

  // Advance through two more intervals
  await time.nextAsync();
  assertEquals(callCount, 2);

  await time.nextAsync();
  assertEquals(callCount, 3);

  // Abort during the delay after call 3
  controller.abort();

  await assertRejects(() => promise, DOMException);
  assertEquals(callCount, 3);
});

Deno.test("poll() handles already aborted signal", async () => {
  const controller = new AbortController();
  controller.abort();

  await assertRejects(
    () =>
      poll(
        () => "value",
        () => false,
        { signal: controller.signal },
      ),
    DOMException,
  );
});

Deno.test("poll() propagates errors from fn", async () => {
  await assertRejects(
    () =>
      poll(
        () => {
          throw new Error("fetch failed");
        },
        () => true,
      ),
    Error,
    "fetch failed",
  );
});
