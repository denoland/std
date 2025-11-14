// Copyright 2018-2025 the Deno authors. MIT license.
import { assertEquals, assertRejects } from "@std/assert";
import { delay } from "./delay.ts";
import { deadline } from "./unstable_deadline.ts";

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

Deno.test("deadline() supports allowInfinity option", async () => {
  await assertRejects(
    () => deadline(Promise.resolve("Hello"), Infinity),
    TypeError,
    "Argument 1 is not a finite number",
  );
  await deadline(Promise.resolve("Hello"), Infinity, { allowInfinity: true });
});
