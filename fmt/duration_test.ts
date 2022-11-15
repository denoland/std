// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { assertEquals, assertExists } from "../testing/asserts.ts";
import { prettyDuration } from "./duration.ts";

Deno.test({
  name: "duration since epoch",
  fn() {
    assertExists(prettyDuration(Date.now()));
  },
});

Deno.test({
  name: "short duration",
  fn() {
    assertEquals(prettyDuration(99674), "0d 0h 1m 39s 674ms 0µs 0ns");
  },
});

Deno.test({
  name: "full duration",
  fn() {
    assertEquals(
      prettyDuration(99674, { formatType: "full" }),
      "0 days, 0 hours, 1 minutes, 39 seconds, 674 milliseconds, 0 microseconds, 0 nanoseconds",
    );
  },
});

Deno.test({
  name: "time duration",
  fn() {
    assertEquals(
      prettyDuration(99674, { formatType: "time" }),
      "00:00:01:39:674:000:000",
    );
  },
});

Deno.test({
  name: "negative duration",
  fn() {
    assertEquals(
      prettyDuration(-99674, { formatType: "time" }),
      "00:00:01:39:674:000:000",
    );
  },
});

Deno.test({
  name: "full duration ignore zero",
  fn() {
    assertEquals(
      prettyDuration(99674, { formatType: "full", ignoreZero: true }),
      "1 minutes, 39 seconds, 674 milliseconds",
    );
  },
});

Deno.test({
  name: "short duration ignore zero",
  fn() {
    assertEquals(prettyDuration(99674, { ignoreZero: true }), "1m 39s 674ms");
  },
});
