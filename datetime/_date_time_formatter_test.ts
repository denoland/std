// Copyright 2018-2025 the Deno authors. MIT license.
import { assertEquals, assertThrows } from "@std/assert";
import { FakeTime } from "@std/testing/time";
import { DateTimeFormatter } from "./_date_time_formatter.ts";

Deno.test("new DateTimeFormatter() errors on unknown or unsupported format", () => {
  assertThrows(() => new DateTimeFormatter("yyyy-nn-dd"));
  assertThrows(() => new DateTimeFormatter("G"));
  assertThrows(() => new DateTimeFormatter("E"));
  assertThrows(() => new DateTimeFormatter("z"));
});

Deno.test("dateTimeFormatter.format()", async (t) => {
  await t.step("handles basic cases", () => {
    const cases: [string, Date, string][] = [
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
    ];
    for (const [format, date, expected] of cases) {
      const formatter = new DateTimeFormatter(format);
      assertEquals(formatter.format(date), expected);
    }
  });

  await t.step("handles yyyy", () => {
    const formatter = new DateTimeFormatter("yyyy");
    assertEquals(formatter.format(new Date(2020, 0, 1)), "2020");
  });
  await t.step("handles yy", () => {
    const formatter = new DateTimeFormatter("yy");
    assertEquals(formatter.format(new Date(2020, 0, 1)), "20");
  });

  await t.step("handles MM", () => {
    const formatter = new DateTimeFormatter("MM");
    assertEquals(formatter.format(new Date(2020, 0, 1)), "01");
    assertEquals(formatter.format(new Date(2020, 11, 1)), "12");
  });
  await t.step("handles M", () => {
    const formatter = new DateTimeFormatter("M");
    assertEquals(formatter.format(new Date(2020, 0, 1)), "1");
    assertEquals(formatter.format(new Date(2020, 11, 1)), "12");
  });

  await t.step("handles dd", () => {
    const formatter = new DateTimeFormatter("dd");
    assertEquals(formatter.format(new Date(2020, 0, 1)), "01");
    assertEquals(formatter.format(new Date(2020, 0, 22)), "22");
  });
  await t.step("handles d", () => {
    const formatter = new DateTimeFormatter("d");
    assertEquals(formatter.format(new Date(2020, 0, 1)), "1");
    assertEquals(formatter.format(new Date(2020, 0, 22)), "22");
  });

  await t.step("handles aaaaa", () => {
    const formatter = new DateTimeFormatter("aaaaa");
    assertEquals(formatter.format(new Date(2020, 0, 1, 0, 0, 0)), "A");
    assertEquals(formatter.format(new Date(2020, 0, 1, 1, 0, 0)), "A");
    assertEquals(formatter.format(new Date(2020, 0, 1, 12, 0, 0)), "P");
    assertEquals(formatter.format(new Date(2020, 0, 1, 13, 0, 0)), "P");
  });
  await t.step("handles aaaa", () => {
    const formatter = new DateTimeFormatter("aaaa");
    assertEquals(formatter.format(new Date(2020, 0, 1, 0, 0, 0)), "AM");
    assertEquals(formatter.format(new Date(2020, 0, 1, 1, 0, 0)), "AM");
    assertEquals(formatter.format(new Date(2020, 0, 1, 12, 0, 0)), "PM");
    assertEquals(formatter.format(new Date(2020, 0, 1, 13, 0, 0)), "PM");
  });
  await t.step("handles a, aa, aaa", () => {
    const formats = ["a", "aa", "aaa"];
    for (const format of formats) {
      const formatter = new DateTimeFormatter(format);
      assertEquals(formatter.format(new Date(2020, 0, 1, 0, 0, 0)), "AM");
      assertEquals(formatter.format(new Date(2020, 0, 1, 1, 0, 0)), "AM");
      assertEquals(formatter.format(new Date(2020, 0, 1, 12, 0, 0)), "PM");
      assertEquals(formatter.format(new Date(2020, 0, 1, 13, 0, 0)), "PM");
    }
  });

  await t.step("handles HH", () => {
    const formatter = new DateTimeFormatter("HH");
    assertEquals(formatter.format(new Date(2020, 0, 1, 0, 0, 0)), "00");
    assertEquals(formatter.format(new Date(2020, 0, 1, 22, 0, 0)), "22");
  });
  await t.step("handles H", () => {
    const formatter = new DateTimeFormatter("H");
    assertEquals(formatter.format(new Date(2020, 0, 1, 0, 0, 0)), "0");
    assertEquals(formatter.format(new Date(2020, 0, 1, 22, 0, 0)), "22");
  });
  await t.step("handles hh", () => {
    const formatter = new DateTimeFormatter("hh");
    assertEquals(formatter.format(new Date(2020, 0, 1, 0, 0, 0)), "12");
    assertEquals(formatter.format(new Date(2020, 0, 1, 1, 0, 0)), "01");
    assertEquals(formatter.format(new Date(2020, 0, 1, 22, 0, 0)), "10");
  });
  await t.step("handles h", () => {
    const formatter = new DateTimeFormatter("h");
    assertEquals(formatter.format(new Date(2020, 0, 1, 0, 0, 0)), "12");
    assertEquals(formatter.format(new Date(2020, 0, 1, 1, 0, 0)), "1");
    assertEquals(formatter.format(new Date(2020, 0, 1, 22, 0, 0)), "10");
  });

  await t.step("handles mm", () => {
    const formatter = new DateTimeFormatter("mm");
    assertEquals(formatter.format(new Date(2020, 0, 1, 0, 0, 0)), "00");
    assertEquals(formatter.format(new Date(2020, 0, 1, 0, 1, 0)), "01");
    assertEquals(formatter.format(new Date(2020, 0, 1, 0, 22, 0)), "22");
  });
  await t.step("handles m", () => {
    const formatter = new DateTimeFormatter("m");
    assertEquals(formatter.format(new Date(2020, 0, 1, 0, 0, 0)), "0");
    assertEquals(formatter.format(new Date(2020, 0, 1, 0, 1, 0)), "1");
    assertEquals(formatter.format(new Date(2020, 0, 1, 0, 22, 0)), "22");
  });

  await t.step("handles ss", () => {
    const formatter = new DateTimeFormatter("ss");
    assertEquals(formatter.format(new Date(2020, 0, 1, 0, 0, 0)), "00");
    assertEquals(formatter.format(new Date(2020, 0, 1, 0, 0, 1)), "01");
    assertEquals(formatter.format(new Date(2020, 0, 1, 0, 0, 22)), "22");
  });
  await t.step("handles s", () => {
    const formatter = new DateTimeFormatter("s");
    assertEquals(formatter.format(new Date(2020, 0, 1, 0, 0, 0)), "0");
    assertEquals(formatter.format(new Date(2020, 0, 1, 0, 0, 1)), "1");
    assertEquals(formatter.format(new Date(2020, 0, 1, 0, 0, 22)), "22");
  });

  await t.step("handles SSS", () => {
    const formatter = new DateTimeFormatter("SSS");
    assertEquals(formatter.format(new Date(2020, 0, 1, 0, 0, 0, 105)), "105");
    assertEquals(formatter.format(new Date(2020, 0, 1, 0, 0, 0, 10)), "010");
    assertEquals(formatter.format(new Date(2020, 0, 1, 0, 0, 0, 0)), "000");
  });
  await t.step("handles SS", () => {
    const formatter = new DateTimeFormatter("SS");
    assertEquals(formatter.format(new Date(2020, 0, 1, 0, 0, 0, 105)), "10");
    assertEquals(formatter.format(new Date(2020, 0, 1, 0, 0, 0, 10)), "01");
    assertEquals(formatter.format(new Date(2020, 0, 1, 0, 0, 0, 0)), "00");
  });
  await t.step("handles S", () => {
    const formatter = new DateTimeFormatter("S");
    assertEquals(formatter.format(new Date(2020, 0, 1, 0, 0, 0, 105)), "1");
    assertEquals(formatter.format(new Date(2020, 0, 1, 0, 0, 0, 10)), "0");
    assertEquals(formatter.format(new Date(2020, 0, 1, 0, 0, 0, 0)), "0");
  });

  await t.step("handles utc", () => {
    const formatter = new DateTimeFormatter("HH:mm");
    assertEquals(
      formatter.format(
        new Date("2020-01-01T06:30:00.000-01:30"),
        { timeZone: "UTC" },
      ),
      "08:00",
    );
  });
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

Deno.test("DateTimeFormatter.formatPartsToString() handles timeZoneName", () => {
  assertEquals(
    DateTimeFormatter.formatPartsToString(
      new Date(2020, 1, 1),
      [
        { type: "year", value: "numeric" },
        { type: "timeZoneName", value: "UTC" },
      ],
      { timeZone: "UTC" },
    ),
    "2020Z",
  );
});

Deno.test("DateTimeFormatter.formatPartsToDateTimeParts()", async (t) => {
  await t.step("handles basic", () => {
    const format = "yyyy-MM-dd";
    const formatParts = DateTimeFormatter.formatToFormatParts(format);
    assertEquals(
      DateTimeFormatter.formatPartsToDateTimeParts("2020-01-01", formatParts),
      [
        { type: "year", value: "2020" },
        { type: "literal", value: "-" },
        { type: "month", value: "01" },
        { type: "literal", value: "-" },
        { type: "day", value: "01" },
      ],
    );
  });

  await t.step("handles yy", () => {
    const format = "yy";
    const formatParts = DateTimeFormatter.formatToFormatParts(format);
    assertEquals(
      DateTimeFormatter.formatPartsToDateTimeParts("00", formatParts),
      [{ type: "year", value: "2000" }],
    );
    assertEquals(
      DateTimeFormatter.formatPartsToDateTimeParts("20", formatParts),
      [{ type: "year", value: "2020" }],
    );
    assertThrows(() =>
      DateTimeFormatter.formatPartsToDateTimeParts("0", formatParts)
    );
    assertThrows(() =>
      DateTimeFormatter.formatPartsToDateTimeParts("123", formatParts)
    );
  });
  await t.step("handles yyyy", () => {
    const format = "yyyy";
    const formatParts = DateTimeFormatter.formatToFormatParts(format);
    assertEquals(
      DateTimeFormatter.formatPartsToDateTimeParts("2020", formatParts),
      [
        { type: "year", value: "2020" },
      ],
    );
    assertThrows(() =>
      DateTimeFormatter.formatPartsToDateTimeParts("020", formatParts)
    );
    assertThrows(() =>
      DateTimeFormatter.formatPartsToDateTimeParts("12345", formatParts)
    );
  });
  await t.step("handles M", () => {
    const format = "M";
    const formatParts = DateTimeFormatter.formatToFormatParts(format);
    assertEquals(
      DateTimeFormatter.formatPartsToDateTimeParts("10", formatParts),
      [{ type: "month", value: "10" }],
    );
  });
  await t.step("handles MM", () => {
    const format = "MM";
    const formatParts = DateTimeFormatter.formatToFormatParts(format);
    assertEquals(
      DateTimeFormatter.formatPartsToDateTimeParts("10", formatParts),
      [{ type: "month", value: "10" }],
    );
  });
  await t.step("handles MMM", () => {
    const format = "MMM";
    const formatParts = DateTimeFormatter.formatToFormatParts(format);
    assertEquals(
      DateTimeFormatter.formatPartsToDateTimeParts("Jan", formatParts),
      [{ type: "month", value: "Jan" }],
    );
  });
  await t.step("handles MMMM", () => {
    const format = "MMMM";
    const formatParts = DateTimeFormatter.formatToFormatParts(format);
    assertEquals(
      DateTimeFormatter.formatPartsToDateTimeParts("January", formatParts),
      [{ type: "month", value: "January" }],
    );
  });
  await t.step("handles MMMMM", () => {
    const format = "MMMMM";
    const formatParts = DateTimeFormatter.formatToFormatParts(format);
    assertEquals(
      DateTimeFormatter.formatPartsToDateTimeParts("J", formatParts),
      [{ type: "month", value: "J" }],
    );
  });
  await t.step("handles d", () => {
    const format = "d";
    const formatParts = DateTimeFormatter.formatToFormatParts(format);
    assertEquals(
      DateTimeFormatter.formatPartsToDateTimeParts("10", formatParts),
      [{ type: "day", value: "10" }],
    );
  });
  await t.step("handles dd", () => {
    const format = "dd";
    const formatParts = DateTimeFormatter.formatToFormatParts(format);
    assertEquals(
      DateTimeFormatter.formatPartsToDateTimeParts("10", formatParts),
      [{ type: "day", value: "10" }],
    );
  });
  await t.step("handles h", () => {
    const format = "h";
    const formatParts = DateTimeFormatter.formatToFormatParts(format);
    assertEquals(
      DateTimeFormatter.formatPartsToDateTimeParts("1", formatParts),
      [{ type: "hour", value: "1" }],
    );
  });
  await t.step("handles hh", () => {
    const format = "hh";
    const formatParts = DateTimeFormatter.formatToFormatParts(format);
    assertEquals(
      DateTimeFormatter.formatPartsToDateTimeParts("11", formatParts),
      [{ type: "hour", value: "11" }],
    );
  });
  await t.step("throws on h value bigger than 12", () => {
    const format = "h";
    const formatParts = DateTimeFormatter.formatToFormatParts(format);
    assertThrows(() =>
      DateTimeFormatter.formatPartsToDateTimeParts("13", formatParts)
    );
  });
  await t.step("throws on hh value bigger than 12", () => {
    const format = "hh";
    const formatParts = DateTimeFormatter.formatToFormatParts(format);
    assertThrows(() =>
      DateTimeFormatter.formatPartsToDateTimeParts("13", formatParts)
    );
  });
  await t.step("handles H", () => {
    const format = "H";
    const formatParts = DateTimeFormatter.formatToFormatParts(format);
    assertEquals(
      DateTimeFormatter.formatPartsToDateTimeParts("13", formatParts),
      [{ type: "hour", value: "13" }],
    );
  });
  await t.step("handles HH", () => {
    const format = "HH";
    const formatParts = DateTimeFormatter.formatToFormatParts(format);
    assertEquals(
      DateTimeFormatter.formatPartsToDateTimeParts("13", formatParts),
      [{ type: "hour", value: "13" }],
    );
  });
  await t.step("handles m", () => {
    const format = "m";
    const formatParts = DateTimeFormatter.formatToFormatParts(format);
    assertEquals(
      DateTimeFormatter.formatPartsToDateTimeParts("10", formatParts),
      [{ type: "minute", value: "10" }],
    );
  });
  await t.step("handles mm", () => {
    const format = "mm";
    const formatParts = DateTimeFormatter.formatToFormatParts(format);
    assertEquals(
      DateTimeFormatter.formatPartsToDateTimeParts("10", formatParts),
      [{ type: "minute", value: "10" }],
    );
  });
  await t.step("handles s", () => {
    const format = "s";
    const formatParts = DateTimeFormatter.formatToFormatParts(format);
    assertEquals(
      DateTimeFormatter.formatPartsToDateTimeParts("10", formatParts),
      [{ type: "second", value: "10" }],
    );
  });
  await t.step("handles ss", () => {
    const format = "ss";
    const formatParts = DateTimeFormatter.formatToFormatParts(format);
    assertEquals(
      DateTimeFormatter.formatPartsToDateTimeParts("10", formatParts),
      [{ type: "second", value: "10" }],
    );
  });
  await t.step("handles s", () => {
    const format = "s";
    const formatParts = DateTimeFormatter.formatToFormatParts(format);
    assertEquals(
      DateTimeFormatter.formatPartsToDateTimeParts("10", formatParts),
      [{ type: "second", value: "10" }],
    );
  });
  await t.step("handles S", () => {
    const format = "S";
    const formatParts = DateTimeFormatter.formatToFormatParts(format);
    assertEquals(
      DateTimeFormatter.formatPartsToDateTimeParts("1", formatParts),
      [{ type: "fractionalSecond", value: "1" }],
    );
  });
  await t.step("handles SS", () => {
    const format = "SS";
    const formatParts = DateTimeFormatter.formatToFormatParts(format);
    assertEquals(
      DateTimeFormatter.formatPartsToDateTimeParts("10", formatParts),
      [{ type: "fractionalSecond", value: "10" }],
    );
  });
  await t.step("handles SSS", () => {
    const format = "SSS";
    const formatParts = DateTimeFormatter.formatToFormatParts(format);
    assertEquals(
      DateTimeFormatter.formatPartsToDateTimeParts("100", formatParts),
      [{ type: "fractionalSecond", value: "100" }],
    );
  });
  await t.step("handles a: AM", () => {
    const format = "a";
    const formatParts = DateTimeFormatter.formatToFormatParts(format);
    assertEquals(
      DateTimeFormatter.formatPartsToDateTimeParts("AM", formatParts),
      [{ type: "dayPeriod", value: "AM" }],
    );
  });
  await t.step("handles a: AM.", () => {
    const format = "a";
    const formatParts = DateTimeFormatter.formatToFormatParts(format);
    assertEquals(
      DateTimeFormatter.formatPartsToDateTimeParts("AM.", formatParts),
      [{ type: "dayPeriod", value: "AM" }],
    );
  });
  await t.step("handles a: A.M.", () => {
    const format = "a";
    const formatParts = DateTimeFormatter.formatToFormatParts(format);
    assertEquals(
      DateTimeFormatter.formatPartsToDateTimeParts("A.M.", formatParts),
      [{ type: "dayPeriod", value: "AM" }],
    );
  });
  await t.step("handles a: PM", () => {
    const format = "a";
    const formatParts = DateTimeFormatter.formatToFormatParts(format);
    assertEquals(
      DateTimeFormatter.formatPartsToDateTimeParts("PM", formatParts),
      [{ type: "dayPeriod", value: "PM" }],
    );
  });
  await t.step("handles a: PM.", () => {
    const format = "a";
    const formatParts = DateTimeFormatter.formatToFormatParts(format);
    assertEquals(
      DateTimeFormatter.formatPartsToDateTimeParts("PM.", formatParts),
      [{ type: "dayPeriod", value: "PM" }],
    );
  });
  await t.step("handles a: P.M.", () => {
    const format = "a";
    const formatParts = DateTimeFormatter.formatToFormatParts(format);
    assertEquals(
      DateTimeFormatter.formatPartsToDateTimeParts("P.M.", formatParts),
      [{ type: "dayPeriod", value: "PM" }],
    );
  });
  await t.step("handles aaaaa: A", () => {
    const format = "aaaaa";
    const formatParts = DateTimeFormatter.formatToFormatParts(format);
    assertEquals(
      DateTimeFormatter.formatPartsToDateTimeParts("A", formatParts),
      [{ type: "dayPeriod", value: "AM" }],
    );
  });
  await t.step("handles aaaaa: P", () => {
    const format = "aaaaa";
    const formatParts = DateTimeFormatter.formatToFormatParts(format);
    assertEquals(
      DateTimeFormatter.formatPartsToDateTimeParts("P", formatParts),
      [{ type: "dayPeriod", value: "PM" }],
    );
  });
  await t.step("handles timeZoneName", () => {
    const formatParts = [{ type: "timeZoneName" as const, value: "UTC" }];
    assertEquals(
      DateTimeFormatter.formatPartsToDateTimeParts("Z", formatParts),
      [{ type: "timeZoneName", value: "UTC" }],
    );
  });
});

Deno.test("DateTimeFormatter.formatPartsToString() throws on unsupported values", () => {
  const testValue = "testUnsupportedValue";
  const partTypes = [
    "day",
    "dayPeriod",
    "hour",
    "minute",
    "month",
    "second",
    "timeZoneName",
    "year",
    "fractionalSecond",
  ] as const;

  const date = new Date(2020, 5, 10);

  for (const partType of partTypes) {
    assertThrows(
      () =>
        DateTimeFormatter.formatPartsToString(
          date,
          [{ type: partType, value: testValue }],
        ),
      Error,
      `FormatterError: DateTimeFormatPartType "${partType}" does not support value ${testValue}`,
    );
  }
});

Deno.test("DateTimeFormatter.formatPartsToDateTimeParts() throws on unsupported types", () => {
  assertThrows(
    () =>
      DateTimeFormatter.formatPartsToDateTimeParts(
        "2020",
        // deno-lint-ignore no-explicit-any
        [{ type: "unknownTestType" as any, value: 0 }],
      ),
    Error,
    `ParserError: Unknown type: "unknownTestType" (value is 0)`,
  );
});

Deno.test("DateTimeFormatter.formatPartsToDateTimeParts() throws on unsupported values", () => {
  const testValue = "testUnsupportedValue";
  const partTypes = [
    "day",
    "dayPeriod",
    "hour",
    "minute",
    "month",
    "second",
    //"timeZoneName",
    "year",
    "fractionalSecond",
  ] as const;

  for (const partType of partTypes) {
    assertThrows(
      () =>
        DateTimeFormatter.formatPartsToDateTimeParts(
          "2020",
          [{ type: partType, value: testValue }],
        ),
      Error,
      `ParserError: DateTimeFormatPartType "${partType}" does not support value ${testValue}`,
    );
  }

  assertThrows(
    () =>
      DateTimeFormatter.formatPartsToDateTimeParts(
        "2020",
        [{ type: "literal", value: 5 }],
      ),
    Error,
    `ParserError: DateTimeFormatPartType "literal" does not support value 5`,
  );
});

Deno.test("DateTimeFormatter.formatPartsToDateTimeParts() throws on invalid dayPeriod", () => {
  assertThrows(
    () =>
      DateTimeFormatter.formatPartsToDateTimeParts(
        "A",
        [{ type: "dayPeriod", value: "short" }],
      ),
    Error,
    `ParserError: Could not parse dayPeriod from "A"`,
  );
  assertThrows(
    () =>
      DateTimeFormatter.formatPartsToDateTimeParts(
        "A",
        [{ type: "dayPeriod", value: "long" }],
      ),
    Error,
    `ParserError: Could not parse dayPeriod from "A"`,
  );
  assertThrows(
    () =>
      DateTimeFormatter.formatPartsToDateTimeParts(
        "X",
        [{ type: "dayPeriod", value: "narrow" }],
      ),
    Error,
    `ParserError: Could not parse dayPeriod from "X"`,
  );
});

Deno.test("DateTimeFormatter.formatPartsToDateTimeParts() throws if literal is not found", () => {
  assertThrows(
    () =>
      DateTimeFormatter.formatPartsToDateTimeParts(
        "B",
        [{ type: "literal", value: "A" }],
      ),
    Error,
    `ParserError: DateTimeFormatPartType "literal" expected value "A" at the start of remaining input, but found "B"`,
  );
  assertThrows(
    () =>
      DateTimeFormatter.formatPartsToDateTimeParts(
        "",
        [{ type: "literal", value: "A" }],
      ),
    Error,
    `ParserError: DateTimeFormatPartType "literal" expected value "A" at the start of remaining input, but found ""`,
  );
});

Deno.test("DateTimeFormatter.formatPartsToDateTimeParts() throws on an empty string", () => {
  const format = "yyyy-MM-dd";
  const formatParts = DateTimeFormatter.formatToFormatParts(format);
  assertThrows(
    () => DateTimeFormatter.formatPartsToDateTimeParts("", formatParts),
    Error,
    `ParserError: Did not produce a value for type: year, remaining input is empty`,
  );
});

Deno.test("DateTimeFormatter.formatPartsToDateTimeParts() throws on a string which does not match the format", () => {
  const format = "yyyy-MM-dd";
  const formatParts = DateTimeFormatter.formatToFormatParts(format);
  assertThrows(
    () => DateTimeFormatter.formatPartsToDateTimeParts("ABC", formatParts),
    Error,
    `ParserError: Did not produce a value for type: year, remaining input starts with "ABC"`,
  );
});

Deno.test("DateTimeFormatter.formatPartsToDateTimeParts() throws on a string which exceeds the format", () => {
  const format = "yyyy-MM-dd";
  const formatParts = DateTimeFormatter.formatToFormatParts(format);
  assertThrows(
    () =>
      DateTimeFormatter.formatPartsToDateTimeParts(
        "2020-01-01T00:00:00.000Z",
        formatParts,
      ),
    Error,
    `ParserError: Input exceeds format, remaining input starts with "T00:00:00.000Z"`,
  );
});

Deno.test("DateTimeFormatter.dateTimePartsToDate()", () => {
  const date = new Date(2020, 0, 1);
  using _time = new FakeTime(date);
  assertEquals(
    DateTimeFormatter.dateTimePartsToDate([
      { type: "year", value: "2020" },
      { type: "month", value: "01" },
      { type: "day", value: "01" },
      { type: "hour", value: "00" },
      { type: "minute", value: "00" },
      { type: "second", value: "00" },
      { type: "fractionalSecond", value: "000" },
      { type: "dayPeriod", value: "AM" },
    ]),
    date,
  );
  assertEquals(
    DateTimeFormatter.dateTimePartsToDate([]),
    date,
  );
});

Deno.test("DateTimeFormatter.dateTimePartsToDate() works with UTC", () => {
  const date = new Date("2020-01-01T00:00:00.000Z");
  using _time = new FakeTime(date);
  assertEquals(
    DateTimeFormatter.dateTimePartsToDate([
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
  assertEquals(
    DateTimeFormatter.dateTimePartsToDate([
      { type: "timeZoneName", value: "UTC" },
    ]),
    date,
  );
});

Deno.test("DateTimeFormatter.dateTimePartsToDate() works with am dayPeriod", () => {
  const date = new Date("2020-01-01T00:00:00.000Z");
  using _time = new FakeTime(date);
  assertEquals(
    DateTimeFormatter.dateTimePartsToDate([
      { type: "hour", value: "00" },
      { type: "dayPeriod", value: "AM" },
      { type: "timeZoneName", value: "UTC" },
    ]),
    date,
  );
  assertEquals(
    DateTimeFormatter.dateTimePartsToDate([
      { type: "hour", value: "00" },
      { type: "dayPeriod", value: "AM." },
      { type: "timeZoneName", value: "UTC" },
    ]),
    date,
  );
  assertEquals(
    DateTimeFormatter.dateTimePartsToDate([
      { type: "hour", value: "00" },
      { type: "dayPeriod", value: "A.M." },
      { type: "timeZoneName", value: "UTC" },
    ]),
    date,
  );
  assertEquals(
    DateTimeFormatter.dateTimePartsToDate([
      { type: "hour", value: "00" },
      { type: "dayPeriod", value: "am" },
      { type: "timeZoneName", value: "UTC" },
    ]),
    date,
  );
  assertEquals(
    DateTimeFormatter.dateTimePartsToDate([
      { type: "hour", value: "00" },
      { type: "dayPeriod", value: "am." },
      { type: "timeZoneName", value: "UTC" },
    ]),
    date,
  );
  assertEquals(
    DateTimeFormatter.dateTimePartsToDate([
      { type: "hour", value: "00" },
      { type: "dayPeriod", value: "a.m." },
      { type: "timeZoneName", value: "UTC" },
    ]),
    date,
  );
});

Deno.test("DateTimeFormatter.dateTimePartsToDate() works with pm dayPeriod", () => {
  const date = new Date("2020-01-01T13:00:00.000Z");
  using _time = new FakeTime(date);

  assertEquals(
    DateTimeFormatter.dateTimePartsToDate([
      { type: "hour", value: "01" },
      { type: "dayPeriod", value: "PM" },
      { type: "timeZoneName", value: "UTC" },
    ]),
    date,
  );
  assertEquals(
    DateTimeFormatter.dateTimePartsToDate([
      { type: "hour", value: "01" },
      { type: "dayPeriod", value: "PM." },
      { type: "timeZoneName", value: "UTC" },
    ]),
    date,
  );
  assertEquals(
    DateTimeFormatter.dateTimePartsToDate([
      { type: "hour", value: "01" },
      { type: "dayPeriod", value: "P.M." },
      { type: "timeZoneName", value: "UTC" },
    ]),
    date,
  );
  assertEquals(
    DateTimeFormatter.dateTimePartsToDate([
      { type: "hour", value: "01" },
      { type: "dayPeriod", value: "pm" },
      { type: "timeZoneName", value: "UTC" },
    ]),
    date,
  );
  assertEquals(
    DateTimeFormatter.dateTimePartsToDate([
      { type: "hour", value: "01" },
      { type: "dayPeriod", value: "pm." },
      { type: "timeZoneName", value: "UTC" },
    ]),
    date,
  );
  assertEquals(
    DateTimeFormatter.dateTimePartsToDate([
      { type: "hour", value: "01" },
      { type: "dayPeriod", value: "p.m." },
      { type: "timeZoneName", value: "UTC" },
    ]),
    date,
  );
});

Deno.test("DateTimeFormatter.dateTimePartsToDate() throws with invalid dayPeriods", () => {
  assertThrows(
    () =>
      DateTimeFormatter.dateTimePartsToDate([
        { type: "hour", value: "00" },
        { type: "dayPeriod", value: "A.M" },
        { type: "timeZoneName", value: "UTC" },
      ]),
    Error,
    `ParserError: Could not parse dayPeriod from "A.M"`,
  );
  assertThrows(
    () =>
      DateTimeFormatter.dateTimePartsToDate([
        { type: "hour", value: "00" },
        { type: "dayPeriod", value: "a.m" },
        { type: "timeZoneName", value: "UTC" },
      ]),
    Error,
    `ParserError: Could not parse dayPeriod from "a.m"`,
  );
  assertThrows(
    () =>
      DateTimeFormatter.dateTimePartsToDate([
        { type: "hour", value: "00" },
        { type: "dayPeriod", value: "P.M" },
        { type: "timeZoneName", value: "UTC" },
      ]),
    Error,
    `ParserError: Could not parse dayPeriod from "P.M"`,
  );
  assertThrows(
    () =>
      DateTimeFormatter.dateTimePartsToDate([
        { type: "hour", value: "00" },
        { type: "dayPeriod", value: "p.m" },
        { type: "timeZoneName", value: "UTC" },
      ]),
    Error,
    `ParserError: Could not parse dayPeriod from "p.m"`,
  );
  assertThrows(
    () =>
      DateTimeFormatter.dateTimePartsToDate([
        { type: "hour", value: "00" },
        { type: "dayPeriod", value: "noon" },
        { type: "timeZoneName", value: "UTC" },
      ]),
    Error,
    `ParserError: Could not parse dayPeriod from "noon"`,
  );
});

Deno.test("DateTimeFormatter.dateTimePartsToDate() throws on dayPeriod with hour > 12", () => {
  assertThrows(
    () =>
      DateTimeFormatter.dateTimePartsToDate([
        { type: "hour", value: "13" },
        { type: "dayPeriod", value: "AM" },
      ]),
    Error,
    `ParserError: Cannot use dayPeriod with hour greater than 12, hour is "13"`,
  );
});

Deno.test("DateTimeFormatter.dateTimePartsToDate() sets utc", () => {
  const date = new Date("2020-01-01T00:00:00.000Z");
  using _time = new FakeTime(date);
  const cases = [
    [[
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
    [[
      { type: "year", value: "2020" },
      { type: "month", value: "01" },
      { type: "day", value: "01" },
      { type: "timeZoneName", value: "UTC" },
    ], date],
    [[
      { type: "year", value: "2020" },
      { type: "month", value: "01" },
      { type: "timeZoneName", value: "UTC" },
    ], date],
    [[
      { type: "month", value: "01" },
      { type: "timeZoneName", value: "UTC" },
    ], date],
  ] as const;
  for (const [input, output] of cases) {
    assertEquals(DateTimeFormatter.dateTimePartsToDate([...input]), output);
  }
});
