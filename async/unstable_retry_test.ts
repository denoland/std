// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals, assertRejects } from "@std/assert";
import { retry } from "./unstable_retry.ts";
import { RetryError } from "./retry.ts";

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
