// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { assertEquals, assertExists } from "../testing/asserts.ts";
import { format, parse } from "./duration.ts";

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
  name: "format full duration ignore zero",
  fn() {
    assertEquals(
      format(99674, { style: "full", ignoreZero: true }),
      "1 minutes, 39 seconds, 674 milliseconds",
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
  name: "parse narrow duration",
  fn() {
    assertEquals(parse("0d 0h 1m 39s 674ms 0µs 0ns"), 99674);
  },
});

Deno.test({
  name: "parse full duration",
  fn() {
    assertEquals(
      parse(
        "0 days, 0 hours, 1 minutes, 39 seconds, 674 milliseconds, 0 microseconds, 0 nanoseconds",
      ),
      99674,
    );
  },
});

Deno.test({
  name: "parse full duration ignore zero",
  fn() {
    assertEquals(parse("1 minutes, 39 seconds, 674 milliseconds"), 99674);
  },
});

Deno.test({
  name: "parse digital duration",
  fn() {
    assertEquals(parse("00:00:01:39:674:000:000"), 99674);
  },
});

Deno.test({
  name: "parse negative duration",
  fn() {
    assertEquals(parse("-1 minutes, -39 seconds, -674 milliseconds"), 99674);
  },
});

Deno.test({
  name: "parse formatted duration",
  fn() {
    const value = 99674;
    assertEquals(parse(format(value, { style: "digital" })), value);
    assertEquals(parse(format(value, { style: "narrow" })), value);
    assertEquals(parse(format(value, { style: "full" })), value);
    assertEquals(parse(format(value, { ignoreZero: true })), value);
    assertEquals(
      parse(format(value, { style: "digital", ignoreZero: true })),
      value,
    );
    assertEquals(
      parse(format(value, { style: "narrow", ignoreZero: true })),
      value,
    );
    assertEquals(
      parse(format(value, { style: "full", ignoreZero: true })),
      value,
    );
  },
});
