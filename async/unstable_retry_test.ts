// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals, assertRejects } from "@std/assert";
import { retry } from "./unstable_retry.ts";
import { RetryError } from "./retry.ts";

Deno.test("retry() throws if maxTimeout is negative", async () => {
  await assertRejects(
    async () => await retry(() => {}, { maxTimeout: -1 }),
    TypeError,
    "Cannot retry as 'maxTimeout' must be positive: current value is -1",
  );
});

Deno.test("retry() throws if minTimeout is bigger than maxTimeout", async () => {
  await assertRejects(
    async () => await retry(() => {}, { maxTimeout: 1, minTimeout: 2 }),
    TypeError,
    "Cannot retry as 'minTimeout' must be <= 'maxTimeout': current values 'minTimeout=2', 'maxTimeout=1'",
  );
});

Deno.test("retry() throws if jitter is bigger than 1", async () => {
  await assertRejects(
    async () => await retry(() => {}, { jitter: 2 }),
    TypeError,
    "Cannot retry as 'jitter' must be <= 1: current value is 2",
  );
});

Deno.test("retry() only retries errors that are retriable with `isRetriable` option", async () => {
  class HttpError extends Error {
    status: number;
    constructor(status: number) {
      super();
      this.status = status;
    }
  }

  const isRetriable = (err: unknown) =>
    err instanceof HttpError && (err.status === 429 || err.status >= 500);

  const options = {
    minTimeout: 1,
    isRetriable,
  };

  let numCalls: number;

  numCalls = 0;
  await assertRejects(() =>
    retry(() => {
      numCalls++;
      throw new HttpError(400);
    }, options), HttpError);
  assertEquals(numCalls, 1);

  numCalls = 0;
  await assertRejects(() =>
    retry(() => {
      numCalls++;
      throw new HttpError(500);
    }, options), RetryError);
  assertEquals(numCalls, 5);

  numCalls = 0;
  await assertRejects(() =>
    retry(() => {
      throw new HttpError(++numCalls === 3 ? 400 : 500);
    }, options), HttpError);
  assertEquals(numCalls, 3);
});
