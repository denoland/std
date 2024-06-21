// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals, assertRejects } from "@std/assert";
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
    "TimeoutError: Signal timed out.",
  );
  assertEquals(error.name, "AbortError");
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
    "AbortError: The signal has been aborted",
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
