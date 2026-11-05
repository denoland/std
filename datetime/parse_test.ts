// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals, assertThrows } from "@std/assert";
import { FakeTime } from "@std/testing/time";
import { format } from "./format.ts";
import { parse } from "./parse.ts";

Deno.test({
  name: "parse()",
  fn: () => {
    assertEquals(
      parse("01-03-2019 16:30", "MM-dd-yyyy HH:mm"),
      new Date(2019, 0, 3, 16, 30),
    );
    assertEquals(
      parse("01.03.2019 16:30", "MM.dd.yyyy HH:mm"),
      new Date(2019, 0, 3, 16, 30),
    );
    assertEquals(
      parse("01.03.2019 16:30", "MM.dd.yyyy HH:mm"),
      new Date(2019, 0, 3, 16, 30),
    );
    assertEquals(
      parse("03-01-2019 16:31", "dd-MM-yyyy HH:mm"),
      new Date(2019, 0, 3, 16, 31),
    );
    assertEquals(
      parse("2019-01-03 16:32", "yyyy-MM-dd HH:mm"),
      new Date(2019, 0, 3, 16, 32),
    );
    assertEquals(
      parse("16:33 01-03-2019", "HH:mm MM-dd-yyyy"),
      new Date(2019, 0, 3, 16, 33),
    );
    assertEquals(
      parse("01-03-2019 16:33:23.123", "MM-dd-yyyy HH:mm:ss.SSS"),
      new Date(2019, 0, 3, 16, 33, 23, 123),
    );
    assertEquals(
      parse("01-03-2019 09:33 PM", "MM-dd-yyyy HH:mm a"),
      new Date(2019, 0, 3, 21, 33),
    );
    assertEquals(
      parse("01-03-2019 09:33 PM.", "MM-dd-yyyy HH:mm a"),
      new Date(2019, 0, 3, 21, 33),
    );
    assertEquals(
      parse("01-03-2019 09:33 P.M.", "MM-dd-yyyy HH:mm a"),
      new Date(2019, 0, 3, 21, 33),
    );
    assertEquals(
      parse("16:34 03-01-2019", "HH:mm dd-MM-yyyy"),
      new Date(2019, 0, 3, 16, 34),
    );
    assertEquals(
      parse("16:35 2019-01-03", "HH:mm yyyy-MM-dd"),
      new Date(2019, 0, 3, 16, 35),
    );
    assertEquals(
      parse("01-03-2019", "MM-dd-yyyy"),
      new Date(2019, 0, 3),
    );
    assertEquals(
      parse("03-01-2019", "dd-MM-yyyy"),
      new Date(2019, 0, 3),
    );
    assertEquals(
      parse("31-10-2019", "dd-MM-yyyy"),
      new Date(2019, 9, 31),
    );
    assertEquals(
      parse("2019-01-03", "yyyy-MM-dd"),
      new Date(2019, 0, 3),
    );
    assertEquals(
      parse("19-01-03", "yy-MM-dd"),
      new Date(2019, 0, 3),
    );
    assertEquals(
      parse("3-1-19", "d-M-yy"),
      new Date(2019, 0, 3),
    );
  },
});

Deno.test("parse(): The date is 2021-12-31", () => {
  using _time = new FakeTime("2021-12-31");

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

  assertEquals(
    parse("01", "dd"),
    new Date(2021, 11, 1),
  );
  assertEquals(
    parse("15", "dd"),
    new Date(2021, 11, 15),
  );
  assertEquals(
    parse("31", "dd"),
    new Date(2021, 11, 31),
  );

  // Ensure 2021-02-29 (which does not exist) is not an intermediate result
  assertEquals(
    parse("29-02-2020", "dd-MM-yyyy"),
    new Date(2020, 1, 29),
  );
});

Deno.test({
  name: "parse() throws with invalid datetime format",
  fn: () => {
    assertThrows(() => {
      parse("2019-01-01 00:00", "x-y-z");
    }, Error);
    assertThrows(() => {
      parse("2019-01-01", "x-y-z");
    }, Error);
  },
});

Deno.test("parse() reads 12 AM as midnight and 12 PM as noon", () => {
  for (const [am, pm] of [["AM", "PM"], ["AM.", "PM."], ["a.m.", "p.m."]]) {
    assertEquals(
      parse(`2024-01-01 12:00 ${am}`, "yyyy-MM-dd hh:mm a"),
      new Date(2024, 0, 1, 0, 0),
    );
    assertEquals(
      parse(`2024-01-01 12:30 ${am}`, "yyyy-MM-dd hh:mm a"),
      new Date(2024, 0, 1, 0, 30),
    );
    assertEquals(
      parse(`2024-01-01 12:00 ${pm}`, "yyyy-MM-dd hh:mm a"),
      new Date(2024, 0, 1, 12, 0),
    );
    assertEquals(
      parse(`2024-01-01 12:30 ${pm}`, "yyyy-MM-dd hh:mm a"),
      new Date(2024, 0, 1, 12, 30),
    );
  }
});

Deno.test("parse() keeps 1 to 11 o'clock for AM and PM", () => {
  assertEquals(
    parse("2024-01-01 01:15 AM", "yyyy-MM-dd hh:mm a"),
    new Date(2024, 0, 1, 1, 15),
  );
  assertEquals(
    parse("2024-01-01 11:45 AM", "yyyy-MM-dd hh:mm a"),
    new Date(2024, 0, 1, 11, 45),
  );
  assertEquals(
    parse("2024-01-01 01:15 PM", "yyyy-MM-dd hh:mm a"),
    new Date(2024, 0, 1, 13, 15),
  );
  assertEquals(
    parse("2024-01-01 11:45 PM", "yyyy-MM-dd hh:mm a"),
    new Date(2024, 0, 1, 23, 45),
  );
});

Deno.test("parse() round-trips every hour formatted with 'hh:mm a'", () => {
  for (let hour = 0; hour < 24; hour++) {
    const date = new Date(2024, 0, 1, hour, 30);
    const text = format(date, "yyyy-MM-dd hh:mm a");
    assertEquals(parse(text, "yyyy-MM-dd hh:mm a"), date);
  }
});
