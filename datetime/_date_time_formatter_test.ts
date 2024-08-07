// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals, assertThrows } from "@std/assert";
import { FakeTime } from "@std/testing/time";
import { DateTimeFormatter } from "./_date_time_formatter.ts";

Deno.test("dateTimeFormatter.format()", () => {
  const cases = [
    ["yyyy-MM-dd HH:mm:ss a", new Date(2020, 0, 1), "2020-01-01 00:00:00 AM"],
    [
      "yyyy-MM-dd HH:mm:ss a",
      new Date(2020, 0, 1, 23, 59, 59),
      "2020-01-01 23:59:59 PM",
    ],
    ["yyyy-MM-dd a", new Date(2020, 0, 1), "2020-01-01 AM"],
    ["yyyy", new Date(2020, 0, 1), "2020"],
    ["MM", new Date(2020, 0, 1), "01"],
  ] as const;
  for (const [format, date, expected] of cases) {
    const formatter = new DateTimeFormatter(format);
    assertEquals(formatter.format(date), expected);
  }
});

Deno.test("dateTimeFormatter.format() with empty format string returns empty string", () => {
  const format = "";
  const formatter = new DateTimeFormatter(format);
  assertEquals(
    formatter.format(new Date(2020, 0, 1)),
    "",
  );
});

Deno.test("dateTimeFormatter.parse()", () => {
  const format = "yyyy-MM-dd";
  const formatter = new DateTimeFormatter(format);
  assertEquals(formatter.parse("2020-01-01"), new Date(2020, 0, 1));
});

Deno.test("dateTimeFormatter.parseToParts()", () => {
  const format = "yyyy-MM-dd";
  const formatter = new DateTimeFormatter(format);
  assertEquals(formatter.parseToParts("2020-01-01"), [
    { type: "year", value: "2020" },
    { type: "literal", value: "-" },
    { type: "month", value: "01" },
    { type: "literal", value: "-" },
    { type: "day", value: "01" },
  ]);
});

Deno.test("dateTimeFormatter.parseToParts() throws on an empty string", () => {
  const format = "yyyy-MM-dd";
  const formatter = new DateTimeFormatter(format);
  assertThrows(
    () => formatter.parseToParts(""),
    Error,
    "value not valid for token",
  );
});

Deno.test("dateTimeFormatter.parseToParts() throws on a string which exceeds the format", () => {
  const format = "yyyy-MM-dd";
  const formatter = new DateTimeFormatter(format);
  assertThrows(
    () => formatter.parseToParts("2020-01-01T00:00:00.000Z"),
    Error,
    "datetime string was not fully parsed!",
  );
});

Deno.test("dateTimeFormatter.partsToDate()", () => {
  const date = new Date("2020-01-01T00:00:00.000Z");
  using _time = new FakeTime(date);
  const format = "yyyy-MM-dd HH:mm:ss.SSS a";
  const formatter = new DateTimeFormatter(format);
  assertEquals(
    +formatter.partsToDate([
      { type: "year", value: "2020" },
      { type: "month", value: "01" },
      { type: "day", value: "01" },
      { type: "hour", value: "00" },
      { type: "minute", value: "00" },
      { type: "second", value: "00" },
      { type: "fractionalSecond", value: "000" },
      { type: "dayPeriod", value: "AM" },
      { type: "timeZoneName", value: "UTC" },
    ]),
    +date,
  );
});

Deno.test("dateTimeFormatter.partsToDate() sets utc", () => {
  const date = new Date("2020-01-01T00:00:00.000Z");
  using _time = new FakeTime(date);
  const cases = [
    ["yyyy-MM-dd HH:mm:ss.SSS a", [
      { type: "year", value: "2020" },
      { type: "month", value: "01" },
      { type: "day", value: "01" },
      { type: "hour", value: "00" },
      { type: "minute", value: "00" },
      { type: "second", value: "00" },
      { type: "fractionalSecond", value: "000" },
      { type: "timeZoneName", value: "UTC" },
      { type: "dayPeriod", value: "AM" },
    ], date],
    ["yyyy-MM-dd", [
      { type: "year", value: "2020" },
      { type: "month", value: "01" },
      { type: "day", value: "01" },
      { type: "timeZoneName", value: "UTC" },
    ], date],
    ["yyyy-MM", [
      { type: "year", value: "2020" },
      { type: "month", value: "01" },
      { type: "timeZoneName", value: "UTC" },
    ], date],
  ] as const;
  for (const [format, input, output] of cases) {
    const formatter = new DateTimeFormatter(format);
    assertEquals(+formatter.partsToDate([...input]), +output);
  }
});
