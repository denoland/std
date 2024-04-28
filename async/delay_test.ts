// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { delay } from "./delay.ts";
import {
  assert,
  assertEquals,
  assertInstanceOf,
  assertRejects,
  assertStrictEquals,
} from "@std/assert";
import { assertSpyCalls, stub } from "@std/testing/mock";

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

Deno.test("delay() handles persitent option", async () => {
  using unrefTimer = stub(Deno, "unrefTimer");
  await delay(100, { persistent: false });
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
      throw new Error("Error!");
    });
    try {
      await delay(100, { persistent: false });
    } catch (e) {
      assert(e instanceof Error);
      assertEquals(e.message, "Error!");
      assertSpyCalls(unrefTimer, 1);
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
