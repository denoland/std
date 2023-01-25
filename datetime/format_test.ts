// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../testing/asserts.ts";
import { format } from "./format.ts";

Deno.test({
  name: "[std/datetime] format",
  fn: () => {
    // 00 hours
    assertEquals(
      "01:00:00",
      format(new Date("2019-01-01T01:00:00"), "HH:mm:ss"),
    );
    assertEquals(
      "13:00:00",
      format(new Date("2019-01-01T13:00:00"), "HH:mm:ss"),
    );

    // 12 hours
    assertEquals(
      "01:00:00",
      format(new Date("2019-01-01T01:00:00"), "hh:mm:ss"),
    );
    assertEquals(
      "01:00:00",
      format(new Date("2019-01-01T13:00:00"), "hh:mm:ss"),
    );

    // milliseconds
    assertEquals(
      "13:00:00.000",
      format(new Date("2019-01-01T13:00:00"), "HH:mm:ss.SSS"),
    );
    assertEquals(
      "13:00:00.000",
      format(new Date("2019-01-01T13:00:00.000"), "HH:mm:ss.SSS"),
    );
    assertEquals(
      "13:00:00.123",
      format(new Date("2019-01-01T13:00:00.123"), "HH:mm:ss.SSS"),
    );

    // day period
    assertEquals(
      "01:00:00 AM",
      format(new Date("2019-01-01T01:00:00"), "HH:mm:ss a"),
    );
    assertEquals(
      "01:00:00 AM",
      format(new Date("2019-01-01T01:00:00"), "hh:mm:ss a"),
    );
    assertEquals(
      "01:00:00 PM",
      format(new Date("2019-01-01T13:00:00"), "hh:mm:ss a"),
    );
    assertEquals(
      "21:00:00 PM",
      format(new Date("2019-01-01T21:00:00"), "HH:mm:ss a"),
    );
    assertEquals(
      "09:00:00 PM",
      format(new Date("2019-01-01T21:00:00"), "hh:mm:ss a"),
    );

    // quoted literal
    assertEquals(
      format(new Date(2019, 0, 20), "'today:' yyyy-MM-dd"),
      "today: 2019-01-20",
    );
  },
});
