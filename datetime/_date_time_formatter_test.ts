// Copyright 2018-2025 the Deno authors. MIT license.
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
    [
      "yyyy-MM-dd hh:mm:ss a",
      new Date(2020, 0, 1, 23, 59, 59),
      "2020-01-01 11:59:59 PM",
    ],
    ["yyyy-MM-dd a", new Date(2020, 0, 1), "2020-01-01 AM"],
    ["yyyy-MM-dd HH:mm:ss a", new Date(2020, 0, 1), "2020-01-01 00:00:00 AM"],
    ["yyyy-MM-dd hh:mm:ss a", new Date(2020, 0, 1), "2020-01-01 12:00:00 AM"],
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

Deno.test("dateTimeFormatter.formatToParts()", async (t) => {
  await t.step("handles basic", () => {
    const format = "yyyy-MM-dd";
    const formatter = new DateTimeFormatter(format);
    assertEquals(formatter.formatToParts("2020-01-01"), [
      { type: "year", value: "2020" },
      { type: "literal", value: "-" },
      { type: "month", value: "01" },
      { type: "literal", value: "-" },
      { type: "day", value: "01" },
    ]);
  });

  await t.step("handles yy", () => {
    const format = "yy";
    const formatter = new DateTimeFormatter(format);
    assertEquals(formatter.formatToParts("20"), [
      { type: "year", value: "20" },
    ]);
  });
  await t.step("handles yyyy", () => {
    const format = "yyyy";
    const formatter = new DateTimeFormatter(format);
    assertEquals(formatter.formatToParts("2020"), [
      { type: "year", value: "2020" },
    ]);
  });
  await t.step("handles M", () => {
    const format = "M";
    const formatter = new DateTimeFormatter(format);
    assertEquals(formatter.formatToParts("10"), [
      { type: "month", value: "10" },
    ]);
  });
  await t.step("handles MM", () => {
    const format = "MM";
    const formatter = new DateTimeFormatter(format);
    assertEquals(formatter.formatToParts("10"), [
      { type: "month", value: "10" },
    ]);
  });
  await t.step("handles d", () => {
    const format = "d";
    const formatter = new DateTimeFormatter(format);
    assertEquals(formatter.formatToParts("10"), [
      { type: "day", value: "10" },
    ]);
  });
  await t.step("handles dd", () => {
    const format = "dd";
    const formatter = new DateTimeFormatter(format);
    assertEquals(formatter.formatToParts("10"), [
      { type: "day", value: "10" },
    ]);
  });
  await t.step("handles h", () => {
    const format = "h";
    const formatter = new DateTimeFormatter(format);
    assertEquals(formatter.formatToParts("1"), [
      { type: "hour", value: "1" },
    ]);
  });
  await t.step("handles hh", () => {
    const format = "hh";
    const formatter = new DateTimeFormatter(format);
    assertEquals(formatter.formatToParts("11"), [
      { type: "hour", value: "11" },
    ]);
  });
  await t.step("handles h value bigger than 12 warning", () => {
    const format = "h";
    const formatter = new DateTimeFormatter(format);
    assertEquals(formatter.formatToParts("13"), [
      { type: "hour", value: "13" },
    ]);
  });
  await t.step("handles hh value bigger than 12 warning", () => {
    const format = "hh";
    const formatter = new DateTimeFormatter(format);
    assertEquals(formatter.formatToParts("13"), [
      { type: "hour", value: "13" },
    ]);
  });
  await t.step("handles H", () => {
    const format = "H";
    const formatter = new DateTimeFormatter(format);
    assertEquals(formatter.formatToParts("13"), [
      { type: "hour", value: "13" },
    ]);
  });
  await t.step("handles HH", () => {
    const format = "HH";
    const formatter = new DateTimeFormatter(format);
    assertEquals(formatter.formatToParts("13"), [
      { type: "hour", value: "13" },
    ]);
  });
  await t.step("handles m", () => {
    const format = "m";
    const formatter = new DateTimeFormatter(format);
    assertEquals(formatter.formatToParts("10"), [
      { type: "minute", value: "10" },
    ]);
  });
  await t.step("handles mm", () => {
    const format = "mm";
    const formatter = new DateTimeFormatter(format);
    assertEquals(formatter.formatToParts("10"), [
      { type: "minute", value: "10" },
    ]);
  });
  await t.step("handles s", () => {
    const format = "s";
    const formatter = new DateTimeFormatter(format);
    assertEquals(formatter.formatToParts("10"), [
      { type: "second", value: "10" },
    ]);
  });
  await t.step("handles ss", () => {
    const format = "ss";
    const formatter = new DateTimeFormatter(format);
    assertEquals(formatter.formatToParts("10"), [
      { type: "second", value: "10" },
    ]);
  });
  await t.step("handles s", () => {
    const format = "s";
    const formatter = new DateTimeFormatter(format);
    assertEquals(formatter.formatToParts("10"), [
      { type: "second", value: "10" },
    ]);
  });
  await t.step("handles S", () => {
    const format = "S";
    const formatter = new DateTimeFormatter(format);
    assertEquals(formatter.formatToParts("1"), [
      { type: "fractionalSecond", value: "1" },
    ]);
  });
  await t.step("handles SS", () => {
    const format = "SS";
    const formatter = new DateTimeFormatter(format);
    assertEquals(formatter.formatToParts("10"), [
      { type: "fractionalSecond", value: "10" },
    ]);
  });
  await t.step("handles SSS", () => {
    const format = "SSS";
    const formatter = new DateTimeFormatter(format);
    assertEquals(formatter.formatToParts("100"), [
      { type: "fractionalSecond", value: "100" },
    ]);
  });
  await t.step("handles a", () => {
    const format = "a";
    const formatter = new DateTimeFormatter(format);
    assertEquals(formatter.formatToParts("AM"), [
      { type: "dayPeriod", value: "AM" },
    ]);
  });
  await t.step("handles a AM", () => {
    const format = "a";
    const formatter = new DateTimeFormatter(format);
    assertEquals(formatter.formatToParts("AM"), [
      { type: "dayPeriod", value: "AM" },
    ]);
  });
  await t.step("handles a AM.", () => {
    const format = "a";
    const formatter = new DateTimeFormatter(format);
    assertEquals(formatter.formatToParts("AM."), [
      { type: "dayPeriod", value: "AM" },
    ]);
  });
  await t.step("handles a A.M.", () => {
    const format = "a";
    const formatter = new DateTimeFormatter(format);
    assertEquals(formatter.formatToParts("A.M."), [
      { type: "dayPeriod", value: "AM" },
    ]);
  });
  await t.step("handles a PM", () => {
    const format = "a";
    const formatter = new DateTimeFormatter(format);
    assertEquals(formatter.formatToParts("PM"), [
      { type: "dayPeriod", value: "PM" },
    ]);
  });
  await t.step("handles a PM.", () => {
    const format = "a";
    const formatter = new DateTimeFormatter(format);
    assertEquals(formatter.formatToParts("PM."), [
      { type: "dayPeriod", value: "PM" },
    ]);
  });
  await t.step("handles a P.M.", () => {
    const format = "a";
    const formatter = new DateTimeFormatter(format);
    assertEquals(formatter.formatToParts("P.M."), [
      { type: "dayPeriod", value: "PM" },
    ]);
  });
});

Deno.test("dateTimeFormatter.formatToParts() throws on an empty string", () => {
  const format = "yyyy-MM-dd";
  const formatter = new DateTimeFormatter(format);
  assertThrows(
    () => formatter.formatToParts(""),
    Error,
    "Cannot format value: The value is not valid for part { year undefined } ",
  );
});

Deno.test("dateTimeFormatter.formatToParts() throws on a string which exceeds the format", () => {
  const format = "yyyy-MM-dd";
  const formatter = new DateTimeFormatter(format);
  assertThrows(
    () => formatter.formatToParts("2020-01-01T00:00:00.000Z"),
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
    formatter.partsToDate([
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
    date,
  );
});
Deno.test("dateTimeFormatter.partsToDate() works with am dayPeriod", () => {
  const date = new Date("2020-01-01T00:00:00.000Z");
  using _time = new FakeTime(date);
  const format = "HH a";
  const formatter = new DateTimeFormatter(format);
  assertEquals(
    formatter.partsToDate([
      { type: "hour", value: "00" },
      { type: "dayPeriod", value: "AM" },
      { type: "timeZoneName", value: "UTC" },
    ]),
    date,
  );
  assertEquals(
    formatter.partsToDate([
      { type: "hour", value: "00" },
      { type: "dayPeriod", value: "AM." },
      { type: "timeZoneName", value: "UTC" },
    ]),
    date,
  );
  assertEquals(
    formatter.partsToDate([
      { type: "hour", value: "00" },
      { type: "dayPeriod", value: "A.M." },
      { type: "timeZoneName", value: "UTC" },
    ]),
    date,
  );
  assertEquals(
    formatter.partsToDate([
      { type: "hour", value: "00" },
      { type: "dayPeriod", value: "am" },
      { type: "timeZoneName", value: "UTC" },
    ]),
    date,
  );
  assertEquals(
    formatter.partsToDate([
      { type: "hour", value: "00" },
      { type: "dayPeriod", value: "am." },
      { type: "timeZoneName", value: "UTC" },
    ]),
    date,
  );
  assertEquals(
    formatter.partsToDate([
      { type: "hour", value: "00" },
      { type: "dayPeriod", value: "a.m." },
      { type: "timeZoneName", value: "UTC" },
    ]),
    date,
  );
});
Deno.test("dateTimeFormatter.partsToDate() works with pm dayPeriod", () => {
  const date = new Date("2020-01-01T13:00:00.000Z");
  using _time = new FakeTime(date);
  const format = "HH a";
  const formatter = new DateTimeFormatter(format);

  assertEquals(
    formatter.partsToDate([
      { type: "hour", value: "01" },
      { type: "dayPeriod", value: "PM" },
      { type: "timeZoneName", value: "UTC" },
    ]),
    date,
  );
  assertEquals(
    formatter.partsToDate([
      { type: "hour", value: "01" },
      { type: "dayPeriod", value: "PM." },
      { type: "timeZoneName", value: "UTC" },
    ]),
    date,
  );
  assertEquals(
    formatter.partsToDate([
      { type: "hour", value: "01" },
      { type: "dayPeriod", value: "P.M." },
      { type: "timeZoneName", value: "UTC" },
    ]),
    date,
  );
  assertEquals(
    formatter.partsToDate([
      { type: "hour", value: "01" },
      { type: "dayPeriod", value: "pm" },
      { type: "timeZoneName", value: "UTC" },
    ]),
    date,
  );
  assertEquals(
    formatter.partsToDate([
      { type: "hour", value: "01" },
      { type: "dayPeriod", value: "pm." },
      { type: "timeZoneName", value: "UTC" },
    ]),
    date,
  );
  assertEquals(
    formatter.partsToDate([
      { type: "hour", value: "01" },
      { type: "dayPeriod", value: "p.m." },
      { type: "timeZoneName", value: "UTC" },
    ]),
    date,
  );
});
Deno.test("dateTimeFormatter.partsToDate() throws with invalid dayPeriods", () => {
  const format = "HH a";
  const formatter = new DateTimeFormatter(format);
  assertThrows(
    () =>
      formatter.partsToDate([
        { type: "hour", value: "00" },
        { type: "dayPeriod", value: "A.M" },
        { type: "timeZoneName", value: "UTC" },
      ]),
    Error,
    "dayPeriod 'A.M' is not supported.",
  );
  assertThrows(
    () =>
      formatter.partsToDate([
        { type: "hour", value: "00" },
        { type: "dayPeriod", value: "a.m" },
        { type: "timeZoneName", value: "UTC" },
      ]),
    Error,
    "dayPeriod 'a.m' is not supported.",
  );
  assertThrows(
    () =>
      formatter.partsToDate([
        { type: "hour", value: "00" },
        { type: "dayPeriod", value: "P.M" },
        { type: "timeZoneName", value: "UTC" },
      ]),
    Error,
    "dayPeriod 'P.M' is not supported.",
  );
  assertThrows(
    () =>
      formatter.partsToDate([
        { type: "hour", value: "00" },
        { type: "dayPeriod", value: "p.m" },
        { type: "timeZoneName", value: "UTC" },
      ]),
    Error,
    "dayPeriod 'p.m' is not supported.",
  );
  assertThrows(
    () =>
      formatter.partsToDate([
        { type: "hour", value: "00" },
        { type: "dayPeriod", value: "noon" },
        { type: "timeZoneName", value: "UTC" },
      ]),
    Error,
    "dayPeriod 'noon' is not supported.",
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
    ["MM", [
      { type: "month", value: "01" },
      { type: "timeZoneName", value: "UTC" },
    ], date],
  ] as const;
  for (const [format, input, output] of cases) {
    const formatter = new DateTimeFormatter(format);
    assertEquals(formatter.partsToDate([...input]), output);
  }
});
