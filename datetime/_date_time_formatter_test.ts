import { assertEquals, assertThrows } from "../assert/mod.ts";
import { assertSpyCall, spy } from "../testing/mock.ts";
import { FakeTime } from "../testing/time.ts";
import { DateTimeFormatter, Tokenizer } from "./_date_time_formatter.ts";

function createRule(
  { format, type, value, options = {} }: {
    format: string;
    type: string;
    value: string;
    options?: { hour12?: boolean };
  },
) {
  return {
    test: (value: string) =>
      value.startsWith(format) ? { value, length: value.length } : undefined,
    fn: () => ({ type, value, ...options }),
  };
}

Deno.test("tokenizer.tokenize()", () => {
  const rules = [{
    test: (value: string) =>
      value.startsWith("foobar")
        ? ({ value, length: value.length })
        : undefined,
    fn: () => ({ type: "baz", value: "foobar" }),
  }];
  const tokenizer = new Tokenizer(rules);
  assertEquals(tokenizer.tokenize("foobar"), [{
    index: 6,
    type: "baz",
    value: "foobar",
  }]);
});

Deno.test("tokenizer.tokenize() works with receiver", () => {
  const rules = [{
    test: (value: string) =>
      value.startsWith("foobar")
        ? ({ value, length: value.length })
        : undefined,
    fn: () => ({ type: "baz", value: "foobar" }),
  }];
  const tokenizer = new Tokenizer(rules);
  const receiver = spy((_) => ({}));
  assertEquals(tokenizer.tokenize("foobar", receiver), [{}]);
  assertSpyCall(receiver, 0, {
    args: [{ index: 6, type: "baz", value: "foobar" }],
    returned: {},
  });
});

Deno.test("tokenizer.tokenize() works with multiple rules", () => {
  const rules = [
    {
      test: (value: string) =>
        value.includes("baz") ? ({ value, length: value.length }) : undefined,
      fn: () => ({ type: "baz", value: "foobar" }),
    },
    {
      test: (value: string) =>
        value.includes("qux") ? ({ value, length: value.length }) : undefined,
      fn: () => ({ type: "qux", value: "qux" }),
    },
  ];
  const tokenizer = new Tokenizer(rules);
  const tokens = tokenizer.tokenize("foobarqux");
  console.log(tokens);
  assertEquals(tokens, [
    { index: 9, type: "qux", value: "qux" },
  ]);
});

Deno.test("tokenizer.tokenize() throws without rules", () => {
  const tokenizer = new Tokenizer();
  assertThrows(
    () => tokenizer.tokenize("foobar"),
    Error,
    "parser error: string not fully parsed!",
  );
});

Deno.test("tokenizer.tokenize() throws when none of the rules match", () => {
  const rules = [{
    test: (value: string) =>
      value.startsWith("foobar")
        ? ({ value, length: value.length })
        : undefined,
    fn: () => ({ type: "baz", value: "foobar" }),
  }];
  const tokenizer = new Tokenizer(rules);
  assertThrows(
    () => tokenizer.tokenize("bazqux"),
    Error,
    "parser error: string not fully parsed!",
  );
});

Deno.test("tokenizer.addRule()", () => {
  const test = spy((value: string) =>
    value === "foobar" ? ({ value, length: value.length }) : undefined
  );
  const fn = spy((_) => ({ type: "foo", value: "bar" }));
  const tokenizer = new Tokenizer().addRule(test, fn);
  const tokens = tokenizer.tokenize("foobar");
  assertEquals(tokens, [{ index: 6, type: "foo", value: "bar" }]);
  assertSpyCall(test, 0, {
    args: ["foobar"],
    returned: { value: "foobar", length: 6 },
  });
  assertSpyCall(fn, 0, {
    args: ["foobar"],
    returned: { type: "foo", value: "bar" },
  });
});

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

Deno.test("dateTimeFormatter.format() throws when a rule returns an unknown value", () => {
  const cases = [
    ["yyyy", "year"],
    ["MM", "month"],
    ["dd", "day"],
    ["HH", "hour"],
    ["mm", "minute"],
    ["ss", "second"],
    ["foo", "bar"],
  ] as const;
  for (const [format, type] of cases) {
    const formatter = new DateTimeFormatter(format, [
      createRule({ format, type, value: "unknown" }),
    ]);
    assertThrows(
      () => formatter.format(new Date(2020, 0, 1)),
      Error,
      "FormatterError",
    );
  }
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

Deno.test("dateTimeFormatter.parseToParts() works with custom rules", () => {
  const cases = [
    ["yyyy", "year", "numeric", "2020"],
    ["yy", "year", "2-digit", "20"],
    ["MM", "month", "2-digit", "03"],
    ["M", "month", "numeric", "3"],
    ["M", "month", "long", "March"],
    ["M", "month", "short", "Mar"],
    ["M", "month", "narrow", "M"],
    ["dd", "day", "2-digit", "03"],
    ["d", "day", "numeric", "3"],
    ["HH", "hour", "2-digit", "13"],
    ["H", "hour", "numeric", "13"],
    ["hh", "hour", "2-digit", "13", { hour12: true }],
    ["h", "hour", "numeric", "13", { hour12: true }],
    ["mm", "minute", "2-digit", "03"],
    ["m", "minute", "numeric", "3"],
    ["ss", "second", "2-digit", "03"],
    ["s", "second", "numeric", "3"],
    ["T", "timeZoneName", "T", "T"],
  ] as const;
  for (const [format, type, value, input, options = {}] of cases) {
    const formatter = new DateTimeFormatter(format, [
      createRule({ format, type, value, options }),
    ]);
    assertEquals(formatter.parseToParts(input), [{ type, value: input }]);
  }
});

Deno.test("dateTimeFormatter.parseToParts() throws on invalid input", () => {
  const format = "foo";
  const formatter = new DateTimeFormatter(format, [
    createRule({ format: "foo", type: "bar", value: "baz" }),
  ]);
  assertThrows(
    () => formatter.parseToParts("foo"),
    Error,
    "bar baz",
  );
});

Deno.test("dateTimeFormatter.parseToParts() throws when a rule returns an unknown value", () => {
  const cases = [
    ["yyyy", "year", "2020"],
    ["MM", "month", "03"],
    ["dd", "day", "03"],
    ["HH", "hour", "03"],
    ["mm", "minute", "03"],
    ["ss", "second", "03"],
  ] as const;
  for (const [format, type, input] of cases) {
    const formatter = new DateTimeFormatter(format, [
      createRule({ format, type, value: "unknown" }),
    ]);
    assertThrows(
      () => formatter.parseToParts(input),
      Error,
      'ParserError: value "unknown" is not supported',
    );
  }
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
