// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals, assertExists } from "../assert/mod.ts";
import { format } from "./duration.ts";

Deno.test({
  name: "format duration since epoch",
  fn() {
    assertExists(format(Date.now()));
  },
});

Deno.test({
  name: "format narrow duration",
  fn() {
    assertEquals(format(99674), "0d 0h 1m 39s 674ms 0µs 0ns");
  },
});

Deno.test({
  name: "format full duration",
  fn() {
    assertEquals(
      format(99674, { style: "full" }),
      "0 days, 0 hours, 1 minutes, 39 seconds, 674 milliseconds, 0 microseconds, 0 nanoseconds",
    );
  },
});

Deno.test({
  name: "format digital duration",
  fn() {
    assertEquals(
      format(99674, { style: "digital" }),
      "00:00:01:39:674:000:000",
    );
  },
});

Deno.test({
  name: "format negative duration",
  fn() {
    assertEquals(
      format(-99674, { style: "digital" }),
      "00:00:01:39:674:000:000",
    );
  },
});

Deno.test({
  name: "format negative duration ignore zero",
  fn() {
    assertEquals(
      format(-99674, { style: "digital", ignoreZero: true }),
      "00:00:01:39:674",
    );
  },
});

Deno.test({
  name: "format negative duration 3 significant parts",
  fn() {
    assertEquals(
      format(-99674, { style: "digital", significantParts: 3 }),
      "00:00:01:39:674",
    );
  },
});

Deno.test({
  name: "format full duration ignore zero",
  fn() {
    assertEquals(
      format(99674, { style: "full", ignoreZero: true }),
      "1 minutes, 39 seconds, 674 milliseconds",
    );
  },
});

Deno.test({
  name: "format full duration ignore zero 2 significant parts",
  fn() {
    assertEquals(
      format(99674, { style: "full", ignoreZero: true, significantParts: 2 }),
      "1 minutes, 39 seconds",
    );
  },
});

Deno.test({
  name: "format narrow duration ignore zero",
  fn() {
    assertEquals(format(99674, { ignoreZero: true }), "1m 39s 674ms");
  },
});

Deno.test({
  name: "format narrow duration ignore zero 2 significant parts",
  fn() {
    assertEquals(
      format(99674, { ignoreZero: true, significantParts: 2 }),
      "1m 39s",
    );
  },
});

Deno.test({
  name: "format narrow duration ignore zero 3 significant parts",
  fn() {
    assertEquals(
      format(7_205_000.5, { ignoreZero: true, significantParts: 3 }),
      "2h 0m 5s",
    );
  },
});
