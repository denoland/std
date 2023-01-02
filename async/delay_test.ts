// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { delay } from "./delay.ts";
import { assert, assertRejects } from "../testing/asserts.ts";

Deno.test("[async] delay", async function () {
  const start = new Date();
  const delayedPromise = delay(100);
  const result = await delayedPromise;
  const diff = new Date().getTime() - start.getTime();
  assert(result === undefined);
  assert(diff >= 100);
});

Deno.test("[async] delay with abort", async function () {
  const start = new Date();
  const abort = new AbortController();
  const { signal } = abort;
  const delayedPromise = delay(100, { signal });
  setTimeout(() => abort.abort(), 0);
  await assertRejects(
    () => delayedPromise,
    DOMException,
    "Delay was aborted",
  );

  const diff = new Date().getTime() - start.getTime();
  assert(diff < 100);
});

Deno.test("[async] delay with non-aborted signal", async function () {
  const start = new Date();
  const abort = new AbortController();
  const { signal } = abort;
  const delayedPromise = delay(100, { signal });
  // abort.abort()
  const result = await delayedPromise;
  const diff = new Date().getTime() - start.getTime();
  assert(result === undefined);
  assert(diff >= 100);
});

Deno.test("[async] delay with signal aborted after delay", async function () {
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

Deno.test("[async] delay with already aborted signal", async function () {
  const start = new Date();
  const abort = new AbortController();
  abort.abort();
  const { signal } = abort;
  const delayedPromise = delay(100, { signal });
  await assertRejects(
    () => delayedPromise,
    DOMException,
    "Delay was aborted",
  );

  const diff = new Date().getTime() - start.getTime();
  assert(diff < 100);
});
