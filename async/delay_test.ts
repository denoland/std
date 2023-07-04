// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { delay } from "./delay.ts";
import {
  assert,
  assertRejects,
  assertStrictEquals,
} from "../testing/asserts.ts";

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
  // https://github.com/denoland/deno/blob/v1.34.3/ext/web/03_abort_signal.js#L83
  await assertRejects(
    () => delayedPromise,
    DOMException,
    "The signal has been aborted",
  );

  const diff = new Date().getTime() - start.getTime();
  assert(diff < 100);
});

Deno.test("[async] delay with abort reason", async function () {
  const start = new Date();
  const abort = new AbortController();
  const { signal } = abort;
  const delayedPromise = delay(100, { signal });
  const reason = new Error("Timeout cancelled");
  setTimeout(() => abort.abort(reason), 0);
  const cause = await assertRejects(() => delayedPromise, Error);
  assertStrictEquals(reason, cause);
  const diff = new Date().getTime() - start.getTime();
  assert(diff < 100);
});

Deno.test("[async] delay with non-aborted signal", async function () {
  const start = new Date();
  const abort = new AbortController();
  const { signal } = abort;
  const delayedPromise = delay(100, { signal });
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
  // https://github.com/denoland/deno/blob/v1.34.3/ext/web/03_abort_signal.js#L83
  await assertRejects(
    () => delayedPromise,
    DOMException,
    "The signal has been aborted",
  );

  const diff = new Date().getTime() - start.getTime();
  assert(diff < 100);
});
