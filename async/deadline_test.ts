// Copyright 2018-2025 the Deno authors. MIT license.
import { assertEquals, assertRejects, assertThrows } from "@std/assert";
import { delay } from "./delay.ts";
import { deadline } from "./deadline.ts";

Deno.test("deadline() returns fulfilled promise", async () => {
  const controller = new AbortController();
  const { signal } = controller;
  const p = delay(100, { signal })
    .catch(() => {})
    .then(() => "Hello");
  const result = await deadline(p, 1000);
  assertEquals(result, "Hello");
  controller.abort();
});

Deno.test("deadline() throws DOMException", async () => {
  const controller = new AbortController();
  const { signal } = controller;
  const p = delay(1000, { signal })
    .catch(() => {})
    .then(() => "Hello");
  const error = await assertRejects(
    () => deadline(p, 100),
    DOMException,
    "Signal timed out.",
  );
  assertEquals(error.name, "TimeoutError");
  controller.abort();
});

Deno.test("deadline() with zero timeout rejects immediately", async () => {
  const controller = new AbortController();
  const { signal } = controller;
  const p = delay(100, { signal })
    .catch(() => {})
    .then(() => "Hello");
  const error = await assertRejects(
    () => deadline(p, 0),
    DOMException,
    "Signal timed out.",
  );
  assertEquals(error.name, "TimeoutError");
  controller.abort();
});

Deno.test("deadline() throws when promise is rejected", async () => {
  const controller = new AbortController();
  const { signal } = controller;
  const p = delay(100, { signal })
    .catch(() => {})
    .then(() => Promise.reject(new Error("booom")));
  await assertRejects(
    async () => {
      await deadline(p, 1000);
    },
    Error,
    "booom",
  );
  controller.abort();
});

Deno.test("deadline() throws TypeError for NaN", () => {
  const p = Promise.resolve("Hello");
  assertThrows(
    () => deadline(p, NaN),
    TypeError,
    "Ms must be a number, received NaN",
  );
});

Deno.test("deadline() handles non-aborted signal", async () => {
  const controller = new AbortController();
  const { signal } = controller;
  const p = delay(100, { signal })
    .catch(() => {})
    .then(() => "Hello");
  const abort = new AbortController();
  const result = await deadline(p, 1000, { signal: abort.signal });
  assertEquals(result, "Hello");
  controller.abort();
});

Deno.test("deadline() handles aborted signal after delay", async () => {
  const controller = new AbortController();
  const { signal } = controller;
  const p = delay(100, { signal })
    .catch(() => {})
    .then(() => "Hello");
  const abort = new AbortController();
  const promise = deadline(p, 100, { signal: abort.signal });
  abort.abort();
  const error = await assertRejects(
    () => promise,
    DOMException,
    "The signal has been aborted",
  );
  assertEquals(error.name, "AbortError");
  controller.abort();
});

Deno.test("deadline() handles already aborted signal", async () => {
  const controller = new AbortController();
  const { signal } = controller;
  const p = delay(100, { signal })
    .catch(() => {})
    .then(() => "Hello");
  const abort = new AbortController();
  abort.abort();
  const error = await assertRejects(
    () => deadline(p, 100, { signal: abort.signal }),
    DOMException,
    "The signal has been aborted",
  );
  assertEquals(error.name, "AbortError");
  controller.abort();
});

Deno.test("deadline() propagates custom abort reason", async () => {
  const controller = new AbortController();
  const { signal } = controller;
  const customError = new Error("Custom abort reason");
  const p = delay(1000, { signal })
    .catch(() => {})
    .then(() => "Hello");
  const abort = new AbortController();
  abort.abort(customError);
  await assertRejects(
    () => deadline(p, 1000, { signal: abort.signal }),
    Error,
    "Custom abort reason",
  );
  controller.abort();
});

Deno.test("deadline() with both timeout and signal, signal aborts first", async () => {
  const controller = new AbortController();
  const { signal } = controller;
  const p = delay(500, { signal })
    .catch(() => {})
    .then(() => "Hello");
  const abort = new AbortController();
  setTimeout(() => abort.abort(), 50);
  const error = await assertRejects(
    () => deadline(p, 1000, { signal: abort.signal }),
    DOMException,
    "The signal has been aborted",
  );
  assertEquals(error.name, "AbortError");
  controller.abort();
});

Deno.test("deadline() with MAX_SAFE_INTEGER does not timeout", async () => {
  const result = await deadline(
    Promise.resolve("Hello"),
    Number.MAX_SAFE_INTEGER,
  );
  assertEquals(result, "Hello");
});

Deno.test("deadline() supports numbers greater than Number.MAX_SAFE_INTEGER", async () => {
  const result = await deadline(Promise.resolve("Hello"), Infinity);
  assertEquals(result, "Hello");
});
