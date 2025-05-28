// Copyright 2018-2025 the Deno authors. MIT license.
import { assertEquals, assertLess, assertRejects } from "@std/assert";
import { waitFor } from "./unstable_wait_for.ts";
import { FakeTime } from "@std/testing/time";

// NOT detecting leaks means that the internal interval was correctly cleared

Deno.test("waitFor() returns fulfilled promise", async () => {
  using time = new FakeTime();

  let flag = false;
  setTimeout(() => {
    flag = true;
  }, 100);
  const startedAt = Date.now();
  const promise = waitFor(() => flag, 1000);
  time.tick(500);
  await promise;
  assertLess(Date.now() - startedAt, 1000);
});

Deno.test("waitFor() throws DOMException on timeout", async () => {
  using time = new FakeTime();

  let flag = false;
  const id = setTimeout(() => {
    flag = true;
  }, 1000);
  const start = Date.now();
  const assertion = assertRejects(
    () => waitFor(() => flag, 100),
    DOMException,
    "Signal timed out.",
  );
  time.tick(500);
  const error = await assertion;
  assertLess(Date.now() - start, 1000);
  assertEquals(error.name, "TimeoutError");
  clearTimeout(id);
});
