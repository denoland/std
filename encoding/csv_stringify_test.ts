// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { assertEquals, assertRejects } from "../testing/asserts.ts";

import {
  DataItem,
  NEWLINE,
  stringify,
  StringifyError,
  StringifyOptions,
} from "./csv_stringify.ts";

type StringifyTestCaseBase = {
  data: DataItem[];
  name: string;
  options?: StringifyOptions;
};

type StringifyTestCaseError = StringifyTestCaseBase & {
  errorMessage?: string;
  // deno-lint-ignore no-explicit-any
  throwsError: new (...args: any[]) => Error;
};

type StringifyTestCase = StringifyTestCaseBase & { expected: string };

const stringifyTestCases: (StringifyTestCase | StringifyTestCaseError)[] = [
  {
    data: [["foo"], ["bar"]],
    errorMessage: 'Property accessor is not of type "number"',
    name: "[CSV_stringify] Access array index using string",
    options: {
      columns: ["a"],
    },
    throwsError: StringifyError,
  },
  {
    data: [["foo"], ["bar"]],
    errorMessage: [
      "Separator cannot include the following strings:",
      '  - U+0022: Quotation mark (")',
      "  - U+000D U+000A: Carriage Return + Line Feed (\\r\\n)",
    ].join("\n"),
    name: "[CSV_stringify] Double quote in separator",
    options: { separator: '"', columns: [0] },
    throwsError: StringifyError,
  },
  {
    data: [["foo"], ["bar"]],
    errorMessage: [
      "Separator cannot include the following strings:",
      '  - U+0022: Quotation mark (")',
      "  - U+000D U+000A: Carriage Return + Line Feed (\\r\\n)",
    ].join("\n"),
    name: "[CSV_stringify] CRLF in separator",
    options: { separator: "\r\n", columns: [0] },
    throwsError: StringifyError,
  },
  {
    data: [{ msg: { value: "foo" } }, { msg: { value: "bar" } }],
    name: "[CSV_stringify] Transform function",
    options: {
      columns: [
        {
          fn: (obj) => obj.toUpperCase(),
          prop: "msg",
        },
      ],
    },
    throwsError: TypeError,
  },
  {
    data: [],
    expected: NEWLINE,
    name: "[CSV_stringify] No data, no columns",
  },
  {
    data: [],
    expected: ``,
    name: "[CSV_stringify] No data, no columns, no headers",
    options: { headers: false },
  },
  {
    data: [],
    options: {
      columns: ["a"],
    },
    expected: `a${NEWLINE}`,
    name: "[CSV_stringify] No data, columns",
  },
  {
    data: [],
    expected: ``,
    name: "[CSV_stringify] No data, columns, no headers",
    options: { headers: false, columns: ["a"] },
  },
  {
    data: [{ a: 1 }, { a: 2 }],
    expected: `${NEWLINE}${NEWLINE}${NEWLINE}`,
    name: "[CSV_stringify] Data, no columns",
  },
  {
    data: [
      ["foo", "bar"],
      ["baz", "qux"],
    ],
    expected: `0\r1${NEWLINE}foo\rbar${NEWLINE}baz\rqux${NEWLINE}`,
    name: "[CSV_stringify] Separator: CR",
    options: { separator: "\r", columns: [0, 1] },
  },
  {
    data: [
      ["foo", "bar"],
      ["baz", "qux"],
    ],
    expected: `0\n1${NEWLINE}foo\nbar${NEWLINE}baz\nqux${NEWLINE}`,
    name: "[CSV_stringify] Separator: LF",
    options: { separator: "\n", columns: [0, 1] },
  },
  {
    data: [{ 1: 1 }, { 1: 2 }],
    options: { columns: [1] },
    expected: `1${NEWLINE}1${NEWLINE}2${NEWLINE}`,
    name: "[CSV_stringify] Column: number accessor, Data: object",
  },
  {
    data: [{ value: "foo" }, { value: "bar" }],
    expected: `foo${NEWLINE}bar${NEWLINE}`,
    name: "[CSV_stringify] Explicit header value, no headers",
    options: { headers: false, columns: [{ header: "Value", prop: "value" }] },
  },
  {
    data: [
      ["key", "foo"],
      ["key", "bar"],
    ],
    options: {
      columns: [1],
    },
    expected: `1${NEWLINE}foo${NEWLINE}bar${NEWLINE}`,
    name: "[CSV_stringify] Column: number accessor, Data: array",
  },
  {
    data: [{ 1: 1 }, { 1: 2 }],
    options: {
      columns: [[1]],
    },
    expected: `1${NEWLINE}1${NEWLINE}2${NEWLINE}`,
    name: "[CSV_stringify] Column: array number accessor, Data: object",
  },
  {
    data: [
      ["key", "foo"],
      ["key", "bar"],
    ],
    options: {
      columns: [[1]],
    },
    expected: `1${NEWLINE}foo${NEWLINE}bar${NEWLINE}`,
    name: "[CSV_stringify] Column: array number accessor, Data: array",
  },
  {
    data: [
      ["key", ["key", "foo"]],
      ["key", ["key", "bar"]],
    ],
    options: {
      columns: [[1, 1]],
    },
    expected: `1${NEWLINE}foo${NEWLINE}bar${NEWLINE}`,
    name: "[CSV_stringify] Column: array number accessor, Data: array",
  },
  {
    data: [{ value: "foo" }, { value: "bar" }],
    options: {
      columns: ["value"],
    },
    expected: `value${NEWLINE}foo${NEWLINE}bar${NEWLINE}`,
    name: "[CSV_stringify] Column: string accessor, Data: object",
  },
  {
    data: [{ value: "foo" }, { value: "bar" }],
    options: {
      columns: [["value"]],
    },
    expected: `value${NEWLINE}foo${NEWLINE}bar${NEWLINE}`,
    name: "[CSV_stringify] Column: array string accessor, Data: object",
  },
  {
    data: [{ msg: { value: "foo" } }, { msg: { value: "bar" } }],
    options: {
      columns: [["msg", "value"]],
    },
    expected: `value${NEWLINE}foo${NEWLINE}bar${NEWLINE}`,
    name: "[CSV_stringify] Column: array string accessor, Data: object",
  },
  {
    data: [{ msg: { value: "foo" } }, { msg: { value: "bar" } }],
    options: {
      columns: [
        {
          header: "Value",
          prop: ["msg", "value"],
        },
      ],
    },
    expected: `Value${NEWLINE}foo${NEWLINE}bar${NEWLINE}`,
    name: "[CSV_stringify] Explicit header",
  },
  {
    data: [{ msg: { value: "foo" } }, { msg: { value: "bar" } }],
    options: {
      columns: [
        {
          fn: (str: string) => str.toUpperCase(),
          prop: ["msg", "value"],
        },
      ],
    },
    expected: `value${NEWLINE}FOO${NEWLINE}BAR${NEWLINE}`,
    name: "[CSV_stringify] Transform function 1",
  },
  {
    data: [{ msg: { value: "foo" } }, { msg: { value: "bar" } }],
    options: {
      columns: [
        {
          fn: (str: string) => Promise.resolve(str.toUpperCase()),
          prop: ["msg", "value"],
        },
      ],
    },
    expected: `value${NEWLINE}FOO${NEWLINE}BAR${NEWLINE}`,
    name: "[CSV_stringify] Transform function 1 async",
  },
  {
    data: [{ msg: { value: "foo" } }, { msg: { value: "bar" } }],
    options: {
      columns: [
        {
          fn: (obj: { value: string }) => obj.value,
          prop: "msg",
        },
      ],
    },
    expected: `msg${NEWLINE}foo${NEWLINE}bar${NEWLINE}`,
    name: "[CSV_stringify] Transform function 2",
  },
  {
    data: [{ msg: { value: "foo" } }, { msg: { value: "bar" } }],
    options: {
      columns: [
        {
          fn: (obj: { value: string }) => obj.value,
          header: "Value",
          prop: "msg",
        },
      ],
    },
    expected: `Value${NEWLINE}foo${NEWLINE}bar${NEWLINE}`,
    name: "[CSV_stringify] Transform function 2, explicit header",
  },
  {
    data: [[{ value: "foo" }], [{ value: "bar" }]],
    options: {
      columns: [0],
    },
    expected:
      `0${NEWLINE}"{""value"":""foo""}"${NEWLINE}"{""value"":""bar""}"${NEWLINE}`,
    name: "[CSV_stringify] Targeted value: object",
  },
  {
    data: [
      [[{ value: "foo" }, { value: "bar" }]],
      [[{ value: "baz" }, { value: "qux" }]],
    ],
    options: {
      columns: [0],
    },
    expected:
      `0${NEWLINE}"[{""value"":""foo""},{""value"":""bar""}]"${NEWLINE}"[{""value"":""baz""},{""value"":""qux""}]"${NEWLINE}`,
    name: "[CSV_stringify] Targeted value: arary of objects",
  },
  {
    data: [[["foo", "bar"]], [["baz", "qux"]]],
    options: {
      columns: [0],
    },
    expected:
      `0${NEWLINE}"[""foo"",""bar""]"${NEWLINE}"[""baz"",""qux""]"${NEWLINE}`,
    name: "[CSV_stringify] Targeted value: array",
  },
  {
    data: [[["foo", "bar"]], [["baz", "qux"]]],
    expected:
      `0${NEWLINE}"[""foo"",""bar""]"${NEWLINE}"[""baz"",""qux""]"${NEWLINE}`,
    name: "[CSV_stringify] Targeted value: array, separator: tab",
    options: { separator: "\t", columns: [0] },
  },
  {
    data: [[], []],
    options: {
      columns: [0],
    },
    expected: `0${NEWLINE}${NEWLINE}${NEWLINE}`,
    name: "[CSV_stringify] Targeted value: undefined",
  },
  {
    data: [[null], [null]],
    options: {
      columns: [0],
    },
    expected: `0${NEWLINE}${NEWLINE}${NEWLINE}`,
    name: "[CSV_stringify] Targeted value: null",
  },
  {
    data: [[0xa], [0xb]],
    options: {
      columns: [0],
    },
    expected: `0${NEWLINE}10${NEWLINE}11${NEWLINE}`,
    name: "[CSV_stringify] Targeted value: hex number",
  },
  {
    data: [[BigInt("1")], [BigInt("2")]],
    options: {
      columns: [0],
    },
    expected: `0${NEWLINE}1${NEWLINE}2${NEWLINE}`,
    name: "[CSV_stringify] Targeted value: BigInt",
  },
  {
    data: [[true], [false]],
    options: {
      columns: [0],
    },
    expected: `0${NEWLINE}true${NEWLINE}false${NEWLINE}`,
    name: "[CSV_stringify] Targeted value: boolean",
  },
  {
    data: [["foo"], ["bar"]],
    options: {
      columns: [0],
    },
    expected: `0${NEWLINE}foo${NEWLINE}bar${NEWLINE}`,
    name: "[CSV_stringify] Targeted value: string",
  },
  {
    data: [[Symbol("foo")], [Symbol("bar")]],
    options: {
      columns: [0],
    },
    expected: `0${NEWLINE}Symbol(foo)${NEWLINE}Symbol(bar)${NEWLINE}`,
    name: "[CSV_stringify] Targeted value: symbol",
  },
  {
    data: [[(n: number) => n]],
    options: {
      columns: [0],
    },
    expected: `0${NEWLINE}(n) => n${NEWLINE}`,
    name: "[CSV_stringify] Targeted value: function",
  },
  {
    data: [['foo"']],
    options: {
      columns: [0],
    },
    expected: `0${NEWLINE}"foo"""${NEWLINE}`,
    name: "[CSV_stringify] Value with double quote",
  },
  {
    data: [["foo\r\n"]],
    options: {
      columns: [0],
    },
    expected: `0${NEWLINE}"foo\r\n"${NEWLINE}`,
    name: "[CSV_stringify] Value with CRLF",
  },
  {
    data: [["foo\r"]],
    options: {
      columns: [0],
    },
    expected: `0${NEWLINE}foo\r${NEWLINE}`,
    name: "[CSV_stringify] Value with CR",
  },
  {
    data: [["foo\n"]],
    options: {
      columns: [0],
    },
    expected: `0${NEWLINE}foo\n${NEWLINE}`,
    name: "[CSV_stringify] Value with LF",
  },
  {
    data: [["foo,"]],
    options: {
      columns: [0],
    },
    expected: `0${NEWLINE}"foo,"${NEWLINE}`,
    name: "[CSV_stringify] Value with comma",
  },
  {
    data: [["foo,"]],
    expected: `0${NEWLINE}foo,${NEWLINE}`,
    name: "[CSV_stringify] Value with comma, tab separator",
    options: { separator: "\t", columns: [0] },
  },
];

for (const tc of stringifyTestCases) {
  if ((tc as StringifyTestCaseError).throwsError) {
    const t = tc as StringifyTestCaseError;
    Deno.test({
      async fn() {
        await assertRejects(
          async () => {
            await stringify(t.data, t.options);
          },
          t.throwsError,
          t.errorMessage,
        );
      },
      name: t.name,
    });
  } else {
    const t = tc as StringifyTestCase;
    Deno.test({
      async fn() {
        const actual = await stringify(t.data, t.options);
        assertEquals(actual, t.expected);
      },
      name: t.name,
    });
  }
}
