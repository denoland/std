// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals, assertThrows } from "@std/assert";
import { FakeTime } from "@std/testing/time";
import {
  dateStringToDateTimeFormatParts,
  dateTimeFormatPartsToDate,
  DateTimeFormatter,
  formatDate,
  formatStringToFormatParts,
} from "./_date_time_formatter.ts";

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
    assertEquals(formatter.format(new Date(20202, 0, 1)), "20202");
  });
  await t.step("handles yy", () => {
    const formatter = new DateTimeFormatter("yy");
    assertEquals(formatter.format(new Date(2020, 0, 1)), "20");
    assertEquals(formatter.format(new Date(20202, 0, 1)), "02");
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

  await t.step("handles a", () => {
    const formatter = new DateTimeFormatter("a");
    assertEquals(formatter.format(new Date(2020, 0, 1, 0, 0, 0)), "AM");
    assertEquals(formatter.format(new Date(2020, 0, 1, 1, 0, 0)), "AM");
    assertEquals(formatter.format(new Date(2020, 0, 1, 12, 0, 0)), "PM");
    assertEquals(formatter.format(new Date(2020, 0, 1, 22, 0, 0)), "PM");
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

Deno.test("new DateTimeFormatter() errors on unknown or unsupported format", () => {
  assertThrows(() => new DateTimeFormatter("yyyy-nn-dd"));
  assertThrows(() => new DateTimeFormatter("G"));
  assertThrows(() => new DateTimeFormatter("E"));
  assertThrows(() => new DateTimeFormatter("z"));
});

Deno.test("formatDate() throws on unsupported values", () => {
  const testValue = "testUnsupportedValue";
  const partTypes = [
    "day",
    //"dayPeriod",
    "hour",
    "minute",
    "month",
    "second",
    //"timeZoneName",
    "year",
    //"fractionalSecond",
  ] as const;

  for (const partType of partTypes) {
    assertThrows(
      () =>
        formatDate(
          new Date(2020, 0, 1),
          [{ type: partType, value: testValue }],
        ),
      Error,
      `FormatterError: value "${testValue}" is not supported`,
    );
  }

  assertThrows(
    () =>
      formatDate(
        new Date(2020, 0, 1),
        // deno-lint-ignore no-explicit-any
        [{ type: "testUnsupportedType" as any, value: testValue }],
      ),
    Error,
    `FormatterError: { testUnsupportedType testUnsupportedValue }`,
  );
});

Deno.test("dateStringToDateTimeFormatParts()", async (t) => {
  await t.step("handles basic", () => {
    const formatParts = formatStringToFormatParts("yyyy-MM-dd");
    assertEquals(dateStringToDateTimeFormatParts("2020-01-01", formatParts), [
      { type: "year", value: "2020" },
      { type: "literal", value: "-" },
      { type: "month", value: "01" },
      { type: "literal", value: "-" },
      { type: "day", value: "01" },
    ]);
  });
  await t.step("handles case without separators", () => {
    const formatParts = formatStringToFormatParts("yyyyMMdd");
    assertEquals(dateStringToDateTimeFormatParts("20200101", formatParts), [
      { type: "year", value: "2020" },
      { type: "month", value: "01" },
      { type: "day", value: "01" },
    ]);
  });

  await t.step("throws on an empty string", () => {
    const formatParts = formatStringToFormatParts("yyyy-MM-dd");
    assertThrows(
      () => dateStringToDateTimeFormatParts("", formatParts),
      Error,
      "Cannot format value: The value is not valid for part { year undefined } ",
    );
  });
  await t.step("throws on a string which does not match the format", () => {
    const formatParts = formatStringToFormatParts("yyyy-MM-dd");
    assertThrows(
      () => dateStringToDateTimeFormatParts("2020-Feb-01", formatParts),
      Error,
      "Cannot format value: The value is not valid for part { month undefined } Feb-01",
    );
  });
  await t.step("throws on a string which exceeds the format", () => {
    const formatParts = formatStringToFormatParts("yyyy-MM-dd");
    assertThrows(
      () =>
        dateStringToDateTimeFormatParts(
          "2020-01-01T00:00:00.000Z",
          formatParts,
        ),
      Error,
      "datetime string was not fully parsed!",
    );
  });
  await t.step("throws on malformatted year", () => {
    const formatParts = formatStringToFormatParts("yyyy-MM-dd");
    assertThrows(
      () => dateStringToDateTimeFormatParts("20-01-01", formatParts),
      Error,
      "Cannot format value: The value is not valid for part { year undefined } 20",
    );
  });

  await t.step("handles yy", () => {
    const formatParts = formatStringToFormatParts("yy");
    assertEquals(dateStringToDateTimeFormatParts("20", formatParts), [
      { type: "year", value: "20" },
    ]);
    assertEquals(dateStringToDateTimeFormatParts("00", formatParts), [
      { type: "year", value: "00" },
    ]);
    assertThrows(() => dateStringToDateTimeFormatParts("2", formatParts));
    assertThrows(() => dateStringToDateTimeFormatParts("202", formatParts));
    assertThrows(() => dateStringToDateTimeFormatParts("2020", formatParts));
  });
  await t.step("handles yyyy", () => {
    const formatParts = formatStringToFormatParts("yyyy");
    assertEquals(dateStringToDateTimeFormatParts("2020", formatParts), [
      { type: "year", value: "2020" },
    ]);
    assertThrows(() => dateStringToDateTimeFormatParts("20", formatParts));
    assertThrows(() => dateStringToDateTimeFormatParts("202", formatParts));
    assertThrows(() => dateStringToDateTimeFormatParts("20202", formatParts));
  });
  await t.step("handles M", () => {
    const formatParts = formatStringToFormatParts("M");
    assertEquals(dateStringToDateTimeFormatParts("10", formatParts), [
      { type: "month", value: "10" },
    ]);
  });
  await t.step("handles MM", () => {
    const formatParts = formatStringToFormatParts("MM");
    assertEquals(dateStringToDateTimeFormatParts("10", formatParts), [
      { type: "month", value: "10" },
    ]);
  });
  await t.step("handles d", () => {
    const formatParts = formatStringToFormatParts("d");
    assertEquals(dateStringToDateTimeFormatParts("10", formatParts), [
      { type: "day", value: "10" },
    ]);
  });
  await t.step("handles dd", () => {
    const formatParts = formatStringToFormatParts("dd");
    assertEquals(dateStringToDateTimeFormatParts("10", formatParts), [
      { type: "day", value: "10" },
    ]);
  });
  await t.step("handles h", () => {
    const formatParts = formatStringToFormatParts("h");
    assertEquals(dateStringToDateTimeFormatParts("1", formatParts), [
      { type: "hour", value: "1" },
    ]);
  });
  await t.step("handles hh", () => {
    const formatParts = formatStringToFormatParts("hh");
    assertEquals(dateStringToDateTimeFormatParts("11", formatParts), [
      { type: "hour", value: "11" },
    ]);
  });
  await t.step("handles h value bigger than 12 warning", () => {
    const formatParts = formatStringToFormatParts("h");
    assertEquals(dateStringToDateTimeFormatParts("13", formatParts), [
      { type: "hour", value: "13" },
    ]);
  });
  await t.step("handles hh value bigger than 12 warning", () => {
    const formatParts = formatStringToFormatParts("hh");
    assertEquals(dateStringToDateTimeFormatParts("13", formatParts), [
      { type: "hour", value: "13" },
    ]);
  });
  await t.step("handles H", () => {
    const formatParts = formatStringToFormatParts("H");
    assertEquals(dateStringToDateTimeFormatParts("13", formatParts), [
      { type: "hour", value: "13" },
    ]);
  });
  await t.step("handles HH", () => {
    const formatParts = formatStringToFormatParts("HH");
    assertEquals(dateStringToDateTimeFormatParts("13", formatParts), [
      { type: "hour", value: "13" },
    ]);
  });
  await t.step("handles m", () => {
    const formatParts = formatStringToFormatParts("m");
    assertEquals(dateStringToDateTimeFormatParts("10", formatParts), [
      { type: "minute", value: "10" },
    ]);
  });
  await t.step("handles mm", () => {
    const formatParts = formatStringToFormatParts("mm");
    assertEquals(dateStringToDateTimeFormatParts("10", formatParts), [
      { type: "minute", value: "10" },
    ]);
  });
  await t.step("handles ss", () => {
    const formatParts = formatStringToFormatParts("ss");
    assertEquals(dateStringToDateTimeFormatParts("10", formatParts), [
      { type: "second", value: "10" },
    ]);
  });
  await t.step("handles s", () => {
    const formatParts = formatStringToFormatParts("s");
    assertEquals(dateStringToDateTimeFormatParts("10", formatParts), [
      { type: "second", value: "10" },
    ]);
  });
  await t.step("handles S", () => {
    const formatParts = formatStringToFormatParts("S");
    assertEquals(dateStringToDateTimeFormatParts("1", formatParts), [
      { type: "fractionalSecond", value: "1" },
    ]);
    assertEquals(dateStringToDateTimeFormatParts("0", formatParts), [
      { type: "fractionalSecond", value: "0" },
    ]);
    assertThrows(() => dateStringToDateTimeFormatParts("00", formatParts));
  });
  await t.step("handles SS", () => {
    const formatParts = formatStringToFormatParts("SS");
    assertEquals(dateStringToDateTimeFormatParts("10", formatParts), [
      { type: "fractionalSecond", value: "10" },
    ]);
    assertEquals(dateStringToDateTimeFormatParts("01", formatParts), [
      { type: "fractionalSecond", value: "01" },
    ]);
    assertEquals(dateStringToDateTimeFormatParts("00", formatParts), [
      { type: "fractionalSecond", value: "00" },
    ]);
    assertThrows(() => dateStringToDateTimeFormatParts("0", formatParts));
    assertThrows(() => dateStringToDateTimeFormatParts("000", formatParts));
  });
  await t.step("handles SSS", () => {
    const formatParts = formatStringToFormatParts("SSS");
    assertEquals(dateStringToDateTimeFormatParts("100", formatParts), [
      { type: "fractionalSecond", value: "100" },
    ]);
    assertEquals(dateStringToDateTimeFormatParts("010", formatParts), [
      { type: "fractionalSecond", value: "010" },
    ]);
    assertEquals(dateStringToDateTimeFormatParts("000", formatParts), [
      { type: "fractionalSecond", value: "000" },
    ]);
    assertThrows(() => dateStringToDateTimeFormatParts("0", formatParts));
    assertThrows(() => dateStringToDateTimeFormatParts("0000", formatParts));
  });
  await t.step("handles a", () => {
    const formatParts = formatStringToFormatParts("a");
    assertEquals(dateStringToDateTimeFormatParts("AM", formatParts), [
      { type: "dayPeriod", value: "AM" },
    ]);
    assertEquals(dateStringToDateTimeFormatParts("AM.", formatParts), [
      { type: "dayPeriod", value: "AM" },
    ]);
    assertEquals(dateStringToDateTimeFormatParts("A.M.", formatParts), [
      { type: "dayPeriod", value: "AM" },
    ]);
    assertEquals(dateStringToDateTimeFormatParts("PM", formatParts), [
      { type: "dayPeriod", value: "PM" },
    ]);
    assertEquals(dateStringToDateTimeFormatParts("PM.", formatParts), [
      { type: "dayPeriod", value: "PM" },
    ]);
    assertEquals(dateStringToDateTimeFormatParts("P.M.", formatParts), [
      { type: "dayPeriod", value: "PM" },
    ]);
  });
});

Deno.test("dateStringToDateTimeFormatParts() throws on unsupported type", () => {
  assertThrows(
    () =>
      dateStringToDateTimeFormatParts(
        "2020",
        // deno-lint-ignore no-explicit-any
        [{ type: "testUnsupportedType" as any, value: 0 }],
      ),
    Error,
    "Cannot format the date, the value (0) of the type (testUnsupportedType) is given",
  );
});

Deno.test("dateStringToDateTimeFormatParts() throws on unsupported values", () => {
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
        dateStringToDateTimeFormatParts(
          "2020",
          [{ type: partType, value: testValue }],
        ),
      Error,
    );
  }

  assertThrows(
    () =>
      dateStringToDateTimeFormatParts(
        "2020",
        [{ type: "literal", value: 5 }],
      ),
    Error,
    `Literal "5" not found "2020"`,
  );
});

Deno.test("dateStringToDateTimeFormatParts() throws on invalid dayPeriod", () => {
  assertThrows(
    () =>
      dateStringToDateTimeFormatParts(
        "A",
        [{ type: "dayPeriod", value: "short" }],
      ),
    Error,
    `Cannot read properties of undefined (reading 'toUpperCase')`,
  );
  assertThrows(
    () =>
      dateStringToDateTimeFormatParts(
        "A",
        [{ type: "dayPeriod", value: "long" }],
      ),
    Error,
    `Cannot read properties of undefined (reading 'toUpperCase')`,
  );
  assertThrows(
    () =>
      dateStringToDateTimeFormatParts(
        "X",
        [{ type: "dayPeriod", value: "narrow" }],
      ),
    Error,
    `Cannot read properties of undefined (reading 'toUpperCase')`,
  );
});

Deno.test("dateStringToDateTimeFormatParts() throws if literal is not found", () => {
  assertThrows(
    () =>
      dateStringToDateTimeFormatParts(
        "B",
        [{ type: "literal", value: "A" }],
      ),
    Error,
    `Literal "A" not found "B"`,
  );
  assertThrows(
    () =>
      dateStringToDateTimeFormatParts(
        "",
        [{ type: "literal", value: "A" }],
      ),
    Error,
    `Literal "A" not found ""`,
  );
});

Deno.test("dateTimeFormatPartsToDate()", () => {
  const date = new Date("2020-01-01T00:00:00.000Z");
  using _time = new FakeTime(date);
  assertEquals(
    dateTimeFormatPartsToDate([
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
    dateTimeFormatPartsToDate([
      { type: "year", value: "20" },
      { type: "month", value: "1" },
      { type: "day", value: "1" },
      { type: "hour", value: "0" },
      { type: "minute", value: "0" },
      { type: "second", value: "0" },
      { type: "fractionalSecond", value: "0" },
      { type: "dayPeriod", value: "AM" },
      { type: "timeZoneName", value: "UTC" },
    ]),
    date,
  );
  assertEquals(
    dateTimeFormatPartsToDate([
      { type: "timeZoneName", value: "UTC" },
    ]),
    date,
  );
});
Deno.test("dateTimeFormatPartsToDate() works with am dayPeriod", () => {
  const date = new Date("2020-01-01T00:00:00.000Z");
  using _time = new FakeTime(date);
  assertEquals(
    dateTimeFormatPartsToDate([
      { type: "hour", value: "00" },
      { type: "dayPeriod", value: "AM" },
      { type: "timeZoneName", value: "UTC" },
    ]),
    date,
  );
  assertEquals(
    dateTimeFormatPartsToDate([
      { type: "hour", value: "00" },
      { type: "dayPeriod", value: "AM." },
      { type: "timeZoneName", value: "UTC" },
    ]),
    date,
  );
  assertEquals(
    dateTimeFormatPartsToDate([
      { type: "hour", value: "00" },
      { type: "dayPeriod", value: "A.M." },
      { type: "timeZoneName", value: "UTC" },
    ]),
    date,
  );
  assertEquals(
    dateTimeFormatPartsToDate([
      { type: "hour", value: "00" },
      { type: "dayPeriod", value: "am" },
      { type: "timeZoneName", value: "UTC" },
    ]),
    date,
  );
  assertEquals(
    dateTimeFormatPartsToDate([
      { type: "hour", value: "00" },
      { type: "dayPeriod", value: "am." },
      { type: "timeZoneName", value: "UTC" },
    ]),
    date,
  );
  assertEquals(
    dateTimeFormatPartsToDate([
      { type: "hour", value: "00" },
      { type: "dayPeriod", value: "a.m." },
      { type: "timeZoneName", value: "UTC" },
    ]),
    date,
  );
});
Deno.test("dateTimeFormatPartsToDate() works with pm dayPeriod", () => {
  const date = new Date("2020-01-01T13:00:00.000Z");
  using _time = new FakeTime(date);

  assertEquals(
    dateTimeFormatPartsToDate([
      { type: "hour", value: "01" },
      { type: "dayPeriod", value: "PM" },
      { type: "timeZoneName", value: "UTC" },
    ]),
    date,
  );
  assertEquals(
    dateTimeFormatPartsToDate([
      { type: "hour", value: "01" },
      { type: "dayPeriod", value: "PM." },
      { type: "timeZoneName", value: "UTC" },
    ]),
    date,
  );
  assertEquals(
    dateTimeFormatPartsToDate([
      { type: "hour", value: "01" },
      { type: "dayPeriod", value: "P.M." },
      { type: "timeZoneName", value: "UTC" },
    ]),
    date,
  );
  assertEquals(
    dateTimeFormatPartsToDate([
      { type: "hour", value: "01" },
      { type: "dayPeriod", value: "pm" },
      { type: "timeZoneName", value: "UTC" },
    ]),
    date,
  );
  assertEquals(
    dateTimeFormatPartsToDate([
      { type: "hour", value: "01" },
      { type: "dayPeriod", value: "pm." },
      { type: "timeZoneName", value: "UTC" },
    ]),
    date,
  );
  assertEquals(
    dateTimeFormatPartsToDate([
      { type: "hour", value: "01" },
      { type: "dayPeriod", value: "p.m." },
      { type: "timeZoneName", value: "UTC" },
    ]),
    date,
  );
});
Deno.test("dateTimeFormatPartsToDate() throws with invalid dayPeriods", () => {
  assertThrows(
    () =>
      dateTimeFormatPartsToDate([
        { type: "hour", value: "00" },
        { type: "dayPeriod", value: "A.M" },
        { type: "timeZoneName", value: "UTC" },
      ]),
    Error,
    "dayPeriod 'A.M' is not supported.",
  );
  assertThrows(
    () =>
      dateTimeFormatPartsToDate([
        { type: "hour", value: "00" },
        { type: "dayPeriod", value: "a.m" },
        { type: "timeZoneName", value: "UTC" },
      ]),
    Error,
    "dayPeriod 'a.m' is not supported.",
  );
  assertThrows(
    () =>
      dateTimeFormatPartsToDate([
        { type: "hour", value: "00" },
        { type: "dayPeriod", value: "P.M" },
        { type: "timeZoneName", value: "UTC" },
      ]),
    Error,
    "dayPeriod 'P.M' is not supported.",
  );
  assertThrows(
    () =>
      dateTimeFormatPartsToDate([
        { type: "hour", value: "00" },
        { type: "dayPeriod", value: "p.m" },
        { type: "timeZoneName", value: "UTC" },
      ]),
    Error,
    "dayPeriod 'p.m' is not supported.",
  );
  assertThrows(
    () =>
      dateTimeFormatPartsToDate([
        { type: "hour", value: "00" },
        { type: "dayPeriod", value: "noon" },
        { type: "timeZoneName", value: "UTC" },
      ]),
    Error,
    "dayPeriod 'noon' is not supported.",
  );
});

Deno.test("dateTimeFormatPartsToDate() sets utc", () => {
  const date = new Date("2020-01-01T00:00:00.000Z");
  using _time = new FakeTime(date);
  const cases = [
    [
      { type: "year", value: "2020" },
      { type: "month", value: "01" },
      { type: "day", value: "01" },
      { type: "hour", value: "00" },
      { type: "minute", value: "00" },
      { type: "second", value: "00" },
      { type: "fractionalSecond", value: "000" },
      { type: "timeZoneName", value: "UTC" },
      { type: "dayPeriod", value: "AM" },
    ],
    [
      { type: "year", value: "2020" },
      { type: "month", value: "01" },
      { type: "day", value: "01" },
      { type: "timeZoneName", value: "UTC" },
    ],
    [
      { type: "year", value: "2020" },
      { type: "month", value: "01" },
      { type: "timeZoneName", value: "UTC" },
    ],
    [
      { type: "month", value: "01" },
      { type: "timeZoneName", value: "UTC" },
    ],
  ] as const;
  for (const input of cases) {
    assertEquals(dateTimeFormatPartsToDate(input), date);
  }
});
