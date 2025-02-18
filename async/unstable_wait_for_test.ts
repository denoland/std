// Copyright 2018-2025 the Deno authors. MIT license.
import { assertEquals, assertLess, assertRejects } from "@std/assert";
import { waitFor } from "./unstable_wait_for.ts";

// NOT detecting leaks means that the internal interval was correctly cleared

Deno.test("waitFor() returns fulfilled promise", async () => {
  let flag = false;
  setTimeout(() => flag = true, 100);
  const start = performance.now();
  await waitFor(() => flag === true, 1000);
  assertLess(performance.now() - start, 1000);
});

Deno.test("waitFor() throws DOMException on timeout", async () => {
  let flag = false;
  const id = setTimeout(() => flag = true, 1000);
  const start = performance.now();
  const error = await assertRejects(
    () => waitFor(() => flag === true, 100),
    DOMException,
    "Signal timed out.",
  );
  assertLess(performance.now() - start, 1000);
  assertEquals(error.name, "TimeoutError");
  clearTimeout(id);
});
