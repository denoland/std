// Copyright 2018-2026 the Deno authors. MIT license.
import { delay } from "./delay.ts";
import {
  assert,
  assertEquals,
  assertInstanceOf,
  assertRejects,
  assertStrictEquals,
} from "@std/assert";
import { assertSpyCalls, stub } from "@std/testing/mock";
import { FakeTime } from "@std/testing/time";

// https://dom.spec.whatwg.org/#interface-AbortSignal
function assertIsDefaultAbortReason(reason: unknown) {
  assertInstanceOf(reason, DOMException);
  assertStrictEquals(reason.name, "AbortError");
}

Deno.test("delay()", async () => {
  const start = new Date();
  const delayedPromise = delay(100);
  const result = await delayedPromise;
  const diff = new Date().getTime() - start.getTime();
  assert(result === undefined);
  assert(diff >= 100);
});

Deno.test("delay() handles abort", async () => {
  const start = new Date();
  const abort = new AbortController();
  const { signal } = abort;
  const delayedPromise = delay(100, { signal });
  setTimeout(() => abort.abort(), 0);
  const cause = await assertRejects(() => delayedPromise);
  const diff = new Date().getTime() - start.getTime();
  assert(diff < 100);
  assertIsDefaultAbortReason(cause);
});

Deno.test("delay() checks abort reason", async (ctx) => {
  async function assertRejectsReason(reason: unknown) {
    const start = new Date();
    const abort = new AbortController();
    const { signal } = abort;
    const delayedPromise = delay(100, { signal });
    setTimeout(() => abort.abort(reason), 0);
    const cause = await assertRejects(() => delayedPromise);
    const diff = new Date().getTime() - start.getTime();
    assert(diff < 100);
    assertStrictEquals(cause, reason);
  }

  await ctx.step("not-undefined values", async () => {
    await Promise.all([
      null,
      new Error("Timeout cancelled"),
      new DOMException("Timeout cancelled", "AbortError"),
      new DOMException("The signal has been aborted", "AbortError"),
    ].map(assertRejectsReason));
  });

  await ctx.step("undefined", async () => {
    const start = new Date();
    const abort = new AbortController();
    const { signal } = abort;
    const delayedPromise = delay(100, { signal });
    setTimeout(() => abort.abort(), 0);
    const cause = await assertRejects(() => delayedPromise);
    const diff = new Date().getTime() - start.getTime();
    assert(diff < 100);
    assertIsDefaultAbortReason(cause);
  });
});

Deno.test("delay() handles non-aborted signal", async () => {
  const start = new Date();
  const abort = new AbortController();
  const { signal } = abort;
  const delayedPromise = delay(100, { signal });
  const result = await delayedPromise;
  const diff = new Date().getTime() - start.getTime();
  assert(result === undefined);
  assert(diff >= 100);
});

Deno.test("delay() handles aborted signal after delay", async () => {
  const start = new Date();
  const abort = new AbortController();
  const { signal } = abort;
  const delayedPromise = delay(100, { signal });
  const result = await delayedPromise;
  abort.abort();
  const diff = new Date().getTime() - start.getTime();
  assert(result === undefined);
  assert(diff >= 100);
});

Deno.test("delay() handles already aborted signal", async () => {
  const start = new Date();
  const abort = new AbortController();
  abort.abort();
  const { signal } = abort;
  const delayedPromise = delay(100, { signal });
  const cause = await assertRejects(() => delayedPromise);
  const diff = new Date().getTime() - start.getTime();
  assert(diff < 100);
  assertIsDefaultAbortReason(cause);
});

Deno.test("delay() handles persistent option", async () => {
  // Stub with itself to ensure the actual function is still called, but we can track calls
  using unrefTimer = stub(Deno, "unrefTimer", Deno.unrefTimer);

  await Promise.all([
    delay(0, { persistent: false }),
    // Longer, persistent timer to ensure the process doesn't actually exit early (this would cause a test failure)
    delay(1),
  ]);
  assertSpyCalls(unrefTimer, 1);
});

Deno.test("delay() handles persistent option with reference error", async () => {
  using unrefTimer = stub(Deno, "unrefTimer", () => {
    throw new ReferenceError();
  });
  await delay(100, { persistent: false });
  assertSpyCalls(unrefTimer, 1);
});

Deno.test({
  name: "delay() handles persistent option with error",
  async fn() {
    using unrefTimer = stub(Deno, "unrefTimer", () => {
      throw new TypeError("Error!");
    });

    await assertRejects(
      () => delay(100, { persistent: false }),
      TypeError,
      "Error!",
    );

    assertSpyCalls(unrefTimer, 1);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "delay() doesn't resolve early with `ms` argument > 0x7fffffff",
  async fn(t) {
    for (
      const bigNum of [
        0x7fffffff,
        0x80000000,
        Number.MAX_SAFE_INTEGER,
        Infinity,
      ]
    ) {
      await t.step(`delay(${bigNum})`, async () => {
        const result = await Promise.race(
          [1, bigNum].map((n) => delay(n).then(() => n)),
        );
        assertEquals(result, 1);
      });
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

async function advanceUntilComplete<T>(
  time: FakeTime,
  tickMs: number,
  task: () => Promise<T>,
): Promise<T> {
  let done = false;

  const result = (async () => {
    try {
      return await task();
    } finally {
      done = true;
    }
  })();

  while (!done) await time.tickAsync(tickMs);

  return result;
}

Deno.test({
  name: "delay() runs to completion with `ms` argument > 0x7fffffff",
  async fn() {
    using time = new FakeTime(0);
    await advanceUntilComplete(time, 2 ** 30, () => delay(2 ** 32));
    assertEquals(time.now, 2 ** 32);
  },
});
