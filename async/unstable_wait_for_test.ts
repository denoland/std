// Copyright 2018-2025 the Deno authors. MIT license.
import { assertAlmostEquals, assertEquals, assertRejects } from "@std/assert";
import { waitFor } from "./unstable_wait_for.ts";

// NOT detecting leaks means that the internal interval was correctly cleared

Deno.test("waitFor() returns fulfilled promise", async () => {
  let flag = false;
  setTimeout(() => flag = true, 100);
  const start = Date.now();
  await waitFor(() => flag === true, 1000);
  // Expects the promise to be resolved after 100ms
  assertAlmostEquals(Date.now() - start, 100, 10);
});

Deno.test("waitFor() throws DOMException on timeout", async () => {
  let flag = false;
  const id = setTimeout(() => flag = true, 1000);
  const start = Date.now();
  const error = await assertRejects(
    () => waitFor(() => flag === true, 100),
    DOMException,
    "Signal timed out.",
  );
  assertAlmostEquals(Date.now() - start, 100, 10);
  assertEquals(error.name, "TimeoutError");
  clearTimeout(id);
});
