// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { assertEquals, assertRejects } from "../testing/asserts.ts";

import { Column, NEWLINE, stringify, StringifyError } from "./csv_stringify.ts";

Deno.test({
  name: "[CSV_stringify] Access array index using string",
  async fn() {
    const columns = ["a"];
    const data = [["foo"], ["bar"]];
    const errorMessage = 'Property accessor is not of type "number"';
    await assertRejects(
      async () => await stringify(data, columns),
      StringifyError,
      errorMessage,
    );
  },
});
Deno.test(
  {
    name: "[CSV_stringify] Double quote in separator",

    async fn() {
      const columns = [0];
      const data = [["foo"], ["bar"]];
      const errorMessage = [
        "Separator cannot include the following strings:",
        '  - U+0022: Quotation mark (")',
        "  - U+000D U+000A: Carriage Return + Line Feed (\\r\\n)",
      ].join("\n");
      const options = { separator: '"' };
      await assertRejects(
        async () => await stringify(data, columns, options),
        StringifyError,
        errorMessage,
      );
    },
  },
);
Deno.test(
  {
    name: "[CSV_stringify] CRLF in separator",
    async fn() {
      const columns = [0];
      const data = [["foo"], ["bar"]];
      const errorMessage = [
        "Separator cannot include the following strings:",
        '  - U+0022: Quotation mark (")',
        "  - U+000D U+000A: Carriage Return + Line Feed (\\r\\n)",
      ].join("\n");
      const options = { separator: "\r\n" };
      await assertRejects(
        async () => await stringify(data, columns, options),
        StringifyError,
        errorMessage,
      );
    },
  },
);
Deno.test(
  {
    name: "[CSV_stringify] Transform function",
    async fn() {
      const columns: Column[] = [
        {
          fn: (obj: string) => obj.toUpperCase(),
          prop: "msg",
        },
      ];
      const data = [{ msg: { value: "foo" } }, { msg: { value: "bar" } }];
      await assertRejects(
        async () => await stringify(data, columns),
        TypeError,
      );
    },
  },
);
Deno.test(
  {
    name: "[CSV_stringify] No data, no columns",

    async fn() {
      const columns: string[] = [];
      const data: string[][] = [];
      const output = NEWLINE;
      assertEquals(await stringify(data, columns), output);
    },
  },
);
Deno.test(
  {
    name: "[CSV_stringify] No data, no columns, no headers",
    async fn() {
      const columns: string[] = [];
      const data: string[][] = [];
      const output = ``;
      const options = { headers: false };
      assertEquals(await stringify(data, columns, options), output);
    },
  },
);
Deno.test(
  {
    name: "[CSV_stringify] No data, columns",
    async fn() {
      const columns = ["a"];
      const data: string[][] = [];
      const output = `a${NEWLINE}`;
      assertEquals(await stringify(data, columns), output);
    },
  },
);
Deno.test(
  {
    name: "[CSV_stringify] No data, columns, no headers",

    async fn() {
      const columns = ["a"];
      const data: string[][] = [];
      const output = ``;
      const options = { headers: false };
      assertEquals(await stringify(data, columns, options), output);
    },
  },
);
Deno.test(
  {
    name: "[CSV_stringify] Data, no columns",
    async fn() {
      const columns: string[] = [];
      const data = [{ a: 1 }, { a: 2 }];
      const output = `${NEWLINE}${NEWLINE}${NEWLINE}`;
      assertEquals(await stringify(data, columns), output);
    },
  },
);
Deno.test(
  {
    name: "[CSV_stringify] Separator: CR",
    async fn() {
      const columns = [0, 1];
      const data = [["foo", "bar"], ["baz", "qux"]];
      const output = `0\r1${NEWLINE}foo\rbar${NEWLINE}baz\rqux${NEWLINE}`;
      const options = { separator: "\r" };
      assertEquals(await stringify(data, columns, options), output);
    },
  },
);
Deno.test(
  {
    name: "[CSV_stringify] Separator: LF",

    async fn() {
      const columns = [0, 1];
      const data = [["foo", "bar"], ["baz", "qux"]];
      const output = `0\n1${NEWLINE}foo\nbar${NEWLINE}baz\nqux${NEWLINE}`;
      const options = { separator: "\n" };
      assertEquals(await stringify(data, columns, options), output);
    },
  },
);
Deno.test(
  {
    name: "[CSV_stringify] Column: number accessor",
    async fn() {
      const columns = [1];
      const data = [{ 1: 1 }, { 1: 2 }];
      const output = `1${NEWLINE}1${NEWLINE}2${NEWLINE}`;
      assertEquals(await stringify(data, columns, options), output);
    },
  },
);
Deno.test(
  {
    name: "[CSV_stringify] Explicit header value, no headers",

    async fn() {
      const columns = [{ header: "Value", prop: "value" }];
      const data = [{ value: "foo" }, { value: "bar" }];
      const output = `foo${NEWLINE}bar${NEWLINE}`;
      const options = { headers: false };
      assertEquals(await stringify(data, columns, options), output);
    },
  },
);
Deno.test(
  {
    name: "[CSV_stringify] Column: number accessor,const data = array",
    async fn() {
      const columns = [1];
      const data = [["key", "foo"], ["key", "bar"]];
      const output = `1${NEWLINE}foo${NEWLINE}bar${NEWLINE}`;
      assertEquals(await stringify(data, columns), output);
    },
  },
);
Deno.test(
  {
    name: "[CSV_stringify] Column: array number accessor",

    async fn() {
      const columns = [[1]];
      const data = [{ 1: 1 }, { 1: 2 }];
      const output = `1${NEWLINE}1${NEWLINE}2${NEWLINE}`;
      assertEquals(await stringify(data, columns), output);
    },
  },
);
Deno.test(
  {
    name: "[CSV_stringify] Column: array number accessor,const data = array",
    async fn() {
      const columns = [[1]];
      const data = [["key", "foo"], ["key", "bar"]];
      const output = `1${NEWLINE}foo${NEWLINE}bar${NEWLINE}`;
      assertEquals(await stringify(data, columns), output);
    },
  },
);
Deno.test(
  {
    name: "[CSV_stringify] Column: array number accessor,const data = array",

    async fn() {
      const columns = [[1, 1]];
      const data = [["key", ["key", "foo"]], ["key", ["key", "bar"]]];
      const output = `1${NEWLINE}foo${NEWLINE}bar${NEWLINE}`;
      assertEquals(await stringify(data, columns), output);
    },
  },
);
Deno.test(
  {
    name: "[CSV_stringify] Column: string accessor",
    async fn() {
      const columns = ["value"];
      const data = [{ value: "foo" }, { value: "bar" }];
      const output = `value${NEWLINE}foo${NEWLINE}bar${NEWLINE}`;
      assertEquals(await stringify(data, columns), output);
    },
  },
);
Deno.test(
  {
    name: "[CSV_stringify] Column: array string accessor",
    async fn() {
      const columns = [["value"]];
      const data = [{ value: "foo" }, { value: "bar" }];
      const output = `value${NEWLINE}foo${NEWLINE}bar${NEWLINE}`;
      assertEquals(await stringify(data, columns), output);
    },
  },
);
Deno.test(
  {
    name: "[CSV_stringify] Column: array string accessor",
    async fn() {
      const columns = [["msg", "value"]];
      const data = [{ msg: { value: "foo" } }, { msg: { value: "bar" } }];
      const output = `value${NEWLINE}foo${NEWLINE}bar${NEWLINE}`;
      assertEquals(await stringify(data, columns), output);
    },
  },
);
Deno.test(
  {
    name: "[CSV_stringify] Explicit header",
    async fn() {
      const columns = [
        {
          header: "Value",
          prop: ["msg", "value"],
        },
      ];
      const data = [{ msg: { value: "foo" } }, { msg: { value: "bar" } }];
      const output = `Value${NEWLINE}foo${NEWLINE}bar${NEWLINE}`;
      assertEquals(await stringify(data, columns), output);
    },
  },
);
Deno.test(
  {
    name: "[CSV_stringify] Transform function 1",
    async fn() {
      const columns = [
        {
          fn: (str: string) => str.toUpperCase(),
          prop: ["msg", "value"],
        },
      ];
      const data = [{ msg: { value: "foo" } }, { msg: { value: "bar" } }];
      const output = `value${NEWLINE}FOO${NEWLINE}BAR${NEWLINE}`;
      assertEquals(await stringify(data, columns), output);
    },
  },
);
Deno.test(
  {
    name: "[CSV_stringify] Transform function 1 async",
    async fn() {
      const columns = [
        {
          fn: (str: string) => Promise.resolve(str.toUpperCase()),
          prop: ["msg", "value"],
        },
      ];
      const data = [{ msg: { value: "foo" } }, { msg: { value: "bar" } }];
      const output = `value${NEWLINE}FOO${NEWLINE}BAR${NEWLINE}`;
      assertEquals(await stringify(data, columns), output);
    },
  },
);

Deno.test(
  {
    name: "[CSV_stringify] Transform function 2",
    async fn() {
      const columns = [
        {
          fn: (obj: { value: string }) => obj.value,
          prop: "msg",
        },
      ];
      const data = [{ msg: { value: "foo" } }, { msg: { value: "bar" } }];
      const output = `msg${NEWLINE}foo${NEWLINE}bar${NEWLINE}`;
      assertEquals(await stringify(data, columns), output);
    },
  },
);
Deno.test(
  {
    name: "[CSV_stringify] Transform function 2, explicit header",
    async fn() {
      const columns = [
        {
          fn: (obj: { value: string }) => obj.value,
          header: "Value",
          prop: "msg",
        },
      ];
      const data = [{ msg: { value: "foo" } }, { msg: { value: "bar" } }];
      const output = `Value${NEWLINE}foo${NEWLINE}bar${NEWLINE}`;
      assertEquals(await stringify(data, columns), output);
    },
  },
);
Deno.test(
  {
    name: "[CSV_stringify] Targeted value: object",
    async fn() {
      const columns = [0];
      const data = [[{ value: "foo" }], [{ value: "bar" }]];
      const output =
        `0${NEWLINE}"{""value"":""foo""}"${NEWLINE}"{""value"":""bar""}"${NEWLINE}`;
      assertEquals(await stringify(data, columns), output);
    },
  },
);
Deno.test(
  {
    name: "[CSV_stringify] Targeted value: arary of objects",
    async fn() {
      const columns = [0];
      const data = [
        [[{ value: "foo" }, { value: "bar" }]],
        [[{ value: "baz" }, { value: "qux" }]],
      ];
      const output =
        `0${NEWLINE}"[{""value"":""foo""},{""value"":""bar""}]"${NEWLINE}"[{""value"":""baz""},{""value"":""qux""}]"${NEWLINE}`;
      assertEquals(await stringify(data, columns), output);
    },
  },
);
Deno.test(
  {
    name: "[CSV_stringify] Targeted value: array",
    async fn() {
      const columns = [0];
      const data = [[["foo", "bar"]], [["baz", "qux"]]];
      const output =
        `0${NEWLINE}"[""foo"",""bar""]"${NEWLINE}"[""baz"",""qux""]"${NEWLINE}`;
      assertEquals(await stringify(data, columns), output);
    },
  },
);
Deno.test(
  {
    name: "[CSV_stringify] Targeted value: array, separator: tab",

    async fn() {
      const columns = [0];
      const data = [[["foo", "bar"]], [["baz", "qux"]]];
      const output =
        `0${NEWLINE}"[""foo"",""bar""]"${NEWLINE}"[""baz"",""qux""]"${NEWLINE}`;
      const options = { separator: "\t" };
      assertEquals(await stringify(data, columns, options), output);
    },
  },
);
Deno.test(
  {
    name: "[CSV_stringify] Targeted value: undefined",
    async fn() {
      const columns = [0];
      const data = [[], []];
      const output = `0${NEWLINE}${NEWLINE}${NEWLINE}`;
      assertEquals(await stringify(data, columns), output);
    },
  },
);
Deno.test(
  {
    name: "[CSV_stringify] Targeted value: null",
    async fn() {
      const columns = [0];
      const data = [[null], [null]];
      const output = `0${NEWLINE}${NEWLINE}${NEWLINE}`;
      assertEquals(await stringify(data, columns), output);
    },
  },
);
Deno.test(
  {
    name: "[CSV_stringify] Targeted value: hex number",
    async fn() {
      const columns = [0];
      const data = [[0xa], [0xb]];
      const output = `0${NEWLINE}10${NEWLINE}11${NEWLINE}`;
      assertEquals(await stringify(data, columns), output);
    },
  },
);
Deno.test(
  {
    name: "[CSV_stringify] Targeted value: BigInt",
    async fn() {
      const columns = [0];
      const data = [[BigInt("1")], [BigInt("2")]];
      const output = `0${NEWLINE}1${NEWLINE}2${NEWLINE}`;
      assertEquals(await stringify(data, columns), output);
    },
  },
);
Deno.test(
  {
    name: "[CSV_stringify] Targeted value: boolean",
    async fn() {
      const columns = [0];
      const data = [[true], [false]];
      const output = `0${NEWLINE}true${NEWLINE}false${NEWLINE}`;
      assertEquals(await stringify(data, columns), output);
    },
  },
);
Deno.test(
  {
    name: "[CSV_stringify] Targeted value: string",
    async fn() {
      const columns = [0];
      const data = [["foo"], ["bar"]];
      const output = `0${NEWLINE}foo${NEWLINE}bar${NEWLINE}`;
      assertEquals(await stringify(data, columns), output);
    },
  },
);
Deno.test(
  {
    name: "[CSV_stringify] Targeted value: symbol",
    async fn() {
      const columns = [0];
      const data = [[Symbol("foo")], [Symbol("bar")]];
      const output = `0${NEWLINE}Symbol(foo)${NEWLINE}Symbol(bar)${NEWLINE}`;
      assertEquals(await stringify(data, columns), output);
    },
  },
);
Deno.test(
  {
    name: "[CSV_stringify] Targeted value: function",
    async fn() {
      const columns = [0];
      const data = [[(n: number) => n]];
      const output = `0${NEWLINE}(n) => n${NEWLINE}`;
      assertEquals(await stringify(data, columns), output);
    },
  },
);
Deno.test(
  {
    name: "[CSV_stringify] Value with double quote",
    async fn() {
      const columns = [0];
      const data = [['foo"']];
      const output = `0${NEWLINE}"foo"""${NEWLINE}`;
      assertEquals(await stringify(data, columns), output);
    },
  },
);
Deno.test(
  {
    name: "[CSV_stringify] Value with CRLF",
    async fn() {
      const columns = [0];
      const data = [["foo\r\n"]];
      const output = `0${NEWLINE}"foo\r\n"${NEWLINE}`;
      assertEquals(await stringify(data, columns), output);
    },
  },
);
Deno.test(
  {
    name: "[CSV_stringify] Value with CR",
    async fn() {
      const columns = [0];
      const data = [["foo\r"]];
      const output = `0${NEWLINE}foo\r${NEWLINE}`;
      assertEquals(await stringify(data, columns), output);
    },
  },
);
Deno.test(
  {
    name: "[CSV_stringify] Value with LF",
    async fn() {
      const columns = [0];
      const data = [["foo\n"]];
      const output = `0${NEWLINE}foo\n${NEWLINE}`;
      assertEquals(await stringify(data, columns), output);
    },
  },
);
Deno.test(
  {
    name: "[CSV_stringify] Value with comma",
    async fn() {
      const columns = [0];
      const data = [["foo,"]];
      const output = `0${NEWLINE}"foo,"${NEWLINE}`;
      assertEquals(await stringify(data, columns), output);
    },
  },
);
Deno.test(
  {
    name: "[CSV_stringify] Value with comma, tab separator",
    async fn() {
      const columns = [0];
      const data = [["foo,"]];
      const output = `0${NEWLINE}foo,${NEWLINE}`;

      const options = { separator: "\t" };
      assertEquals(await stringify(data, columns, options), output);
    },
  },
);
