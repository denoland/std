// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This file contains test cases which needs to be run at the specific date (2021-12-31)
import { assertEquals } from "../testing/asserts.ts";
import { parse } from "./mod.ts";

Deno.test("The date is 2021-12-31", () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  assertEquals(d, new Date(2021, 11, 31));
});

Deno.test("[std/datetime] parse: The date is 2021-12-31", () => {
  assertEquals(
    parse("01-01", "MM-dd"),
    new Date(2021, 0, 1),
  );
  assertEquals(
    parse("02-01", "MM-dd"),
    new Date(2021, 1, 1),
  );
  assertEquals(
    parse("03-01", "MM-dd"),
    new Date(2021, 2, 1),
  );
  assertEquals(
    parse("04-01", "MM-dd"),
    new Date(2021, 3, 1),
  );
  assertEquals(
    parse("05-01", "MM-dd"),
    new Date(2021, 4, 1),
  );
  assertEquals(
    parse("06-01", "MM-dd"),
    new Date(2021, 5, 1),
  );
  assertEquals(
    parse("07-01", "MM-dd"),
    new Date(2021, 6, 1),
  );
  assertEquals(
    parse("08-01", "MM-dd"),
    new Date(2021, 7, 1),
  );
  assertEquals(
    parse("09-01", "MM-dd"),
    new Date(2021, 8, 1),
  );
  assertEquals(
    parse("10-01", "MM-dd"),
    new Date(2021, 9, 1),
  );
  assertEquals(
    parse("11-01", "MM-dd"),
    new Date(2021, 10, 1),
  );
  assertEquals(
    parse("12-01", "MM-dd"),
    new Date(2021, 11, 1),
  );
});
