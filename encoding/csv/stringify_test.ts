// Test ported from Golang
// https://github.com/golang/go/blob/2cc15b1/src/encoding/csv/reader_test.go
// Copyright 2011 The Go Authors. All rights reserved. BSD license.
// https://github.com/golang/go/blob/master/LICENSE
// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { assertEquals, assertThrows } from "../../testing/asserts.ts";
import { NEWLINE, stringify, StringifyError } from "./mod.ts";

Deno.test({
  name: "stringify",
  async fn(t) {
    await t.step({
      name: "Access array index using string",
      fn() {
        const columns = ["a"];
        const data = [["foo"], ["bar"]];
        const errorMessage = 'Property accessor is not of type "number"';
        assertThrows(
          () => stringify(data, { columns }),
          StringifyError,
          errorMessage,
        );
      },
    });
    await t.step(
      {
        name: "Double quote in separator",

        fn() {
          const columns = [0];
          const data = [["foo"], ["bar"]];
          const errorMessage = [
            "Separator cannot include the following strings:",
            '  - U+0022: Quotation mark (")',
            "  - U+000D U+000A: Carriage Return + Line Feed (\\r\\n)",
          ].join("\n");
          const options = { separator: '"', columns };
          assertThrows(
            () => stringify(data, options),
            StringifyError,
            errorMessage,
          );
        },
      },
    );
    await t.step(
      {
        name: "CRLF in separator",
        fn() {
          const columns = [0];
          const data = [["foo"], ["bar"]];
          const errorMessage = [
            "Separator cannot include the following strings:",
            '  - U+0022: Quotation mark (")',
            "  - U+000D U+000A: Carriage Return + Line Feed (\\r\\n)",
          ].join("\n");
          const options = { separator: "\r\n", columns };
          assertThrows(
            () => stringify(data, options),
            StringifyError,
            errorMessage,
          );
        },
      },
    );

    await t.step(
      {
        name: "Invalid data, no columns",
        fn() {
          const data = [{ a: 1 }, { a: 2 }];
          assertThrows(
            () => stringify(data),
            StringifyError,
            "No property accessor function was provided for object",
          );
        },
      },
    );
    await t.step(
      {
        name: "Invalid data, no columns",
        fn() {
          const data = [{ a: 1 }, { a: 2 }];
          assertThrows(
            () => stringify(data),
            StringifyError,
            "No property accessor function was provided for object",
          );
        },
      },
    );
    await t.step(
      {
        name: "No data, no columns",

        fn() {
          const columns: string[] = [];
          const data: string[][] = [];
          const output = NEWLINE;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "No data, no columns, no headers",
        fn() {
          const columns: string[] = [];
          const data: string[][] = [];
          const output = ``;
          const options = { headers: false, columns };
          assertEquals(stringify(data, options), output);
        },
      },
    );
    await t.step(
      {
        name: "No data, columns",
        fn() {
          const columns = ["a"];
          const data: string[][] = [];
          const output = `a${NEWLINE}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "No data, columns, no headers",

        fn() {
          const columns = ["a"];
          const data: string[][] = [];
          const output = ``;
          const options = { headers: false, columns };
          assertEquals(stringify(data, options), output);
        },
      },
    );
    await t.step(
      {
        name: "Separator: CR",
        fn() {
          const columns = [0, 1];
          const data = [["foo", "bar"], ["baz", "qux"]];
          const output = `0\r1${NEWLINE}foo\rbar${NEWLINE}baz\rqux${NEWLINE}`;
          const options = { separator: "\r", columns };
          assertEquals(stringify(data, options), output);
        },
      },
    );
    await t.step(
      {
        name: "Separator: LF",

        fn() {
          const columns = [0, 1];
          const data = [["foo", "bar"], ["baz", "qux"]];
          const output = `0\n1${NEWLINE}foo\nbar${NEWLINE}baz\nqux${NEWLINE}`;
          const options = { separator: "\n", columns };
          assertEquals(stringify(data, options), output);
        },
      },
    );
    await t.step(
      {
        name: "Column: number accessor",
        fn() {
          const columns = [1];
          const data = [{ 1: 1 }, { 1: 2 }];
          const output = `1${NEWLINE}1${NEWLINE}2${NEWLINE}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "Explicit header value, no headers",

        fn() {
          const columns = [{ header: "Value", prop: "value" }];
          const data = [{ value: "foo" }, { value: "bar" }];
          const output = `foo${NEWLINE}bar${NEWLINE}`;
          const options = { headers: false, columns };
          assertEquals(stringify(data, options), output);
        },
      },
    );
    await t.step(
      {
        name: "Column: number accessor,const data = array",
        fn() {
          const columns = [1];
          const data = [["key", "foo"], ["key", "bar"]];
          const output = `1${NEWLINE}foo${NEWLINE}bar${NEWLINE}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "Column: array number accessor",

        fn() {
          const columns = [[1]];
          const data = [{ 1: 1 }, { 1: 2 }];
          const output = `1${NEWLINE}1${NEWLINE}2${NEWLINE}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "Column: array number accessor,const data = array",
        fn() {
          const columns = [[1]];
          const data = [["key", "foo"], ["key", "bar"]];
          const output = `1${NEWLINE}foo${NEWLINE}bar${NEWLINE}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "Column: array number accessor,const data = array",

        fn() {
          const columns = [[1, 1]];
          const data = [["key", ["key", "foo"]], ["key", ["key", "bar"]]];
          const output = `1${NEWLINE}foo${NEWLINE}bar${NEWLINE}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "Column: string accessor",
        fn() {
          const columns = ["value"];
          const data = [{ value: "foo" }, { value: "bar" }];
          const output = `value${NEWLINE}foo${NEWLINE}bar${NEWLINE}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "Column: array string accessor",
        fn() {
          const columns = [["value"]];
          const data = [{ value: "foo" }, { value: "bar" }];
          const output = `value${NEWLINE}foo${NEWLINE}bar${NEWLINE}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "Column: array string accessor",
        fn() {
          const columns = [["msg", "value"]];
          const data = [{ msg: { value: "foo" } }, { msg: { value: "bar" } }];
          const output = `value${NEWLINE}foo${NEWLINE}bar${NEWLINE}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "Explicit header",
        fn() {
          const columns = [
            {
              header: "Value",
              prop: ["msg", "value"],
            },
          ];
          const data = [{ msg: { value: "foo" } }, { msg: { value: "bar" } }];
          const output = `Value${NEWLINE}foo${NEWLINE}bar${NEWLINE}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );

    await t.step(
      {
        name: "Targeted value: object",
        fn() {
          const columns = [0];
          const data = [[{ value: "foo" }], [{ value: "bar" }]];
          const output =
            `0${NEWLINE}"{""value"":""foo""}"${NEWLINE}"{""value"":""bar""}"${NEWLINE}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "Targeted value: arary of objects",
        fn() {
          const columns = [0];
          const data = [
            [[{ value: "foo" }, { value: "bar" }]],
            [[{ value: "baz" }, { value: "qux" }]],
          ];
          const output =
            `0${NEWLINE}"[{""value"":""foo""},{""value"":""bar""}]"${NEWLINE}"[{""value"":""baz""},{""value"":""qux""}]"${NEWLINE}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "Targeted value: array",
        fn() {
          const columns = [0];
          const data = [[["foo", "bar"]], [["baz", "qux"]]];
          const output =
            `0${NEWLINE}"[""foo"",""bar""]"${NEWLINE}"[""baz"",""qux""]"${NEWLINE}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "Targeted value: array, separator: tab",

        fn() {
          const columns = [0];
          const data = [[["foo", "bar"]], [["baz", "qux"]]];
          const output =
            `0${NEWLINE}"[""foo"",""bar""]"${NEWLINE}"[""baz"",""qux""]"${NEWLINE}`;
          const options = { separator: "\t", columns };
          assertEquals(stringify(data, options), output);
        },
      },
    );
    await t.step(
      {
        name: "Targeted value: undefined",
        fn() {
          const columns = [0];
          const data = [[], []];
          const output = `0${NEWLINE}${NEWLINE}${NEWLINE}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "Targeted value: null",
        fn() {
          const columns = [0];
          const data = [[null], [null]];
          const output = `0${NEWLINE}${NEWLINE}${NEWLINE}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "Targeted value: hex number",
        fn() {
          const columns = [0];
          const data = [[0xa], [0xb]];
          const output = `0${NEWLINE}10${NEWLINE}11${NEWLINE}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "Targeted value: BigInt",
        fn() {
          const columns = [0];
          const data = [[BigInt("1")], [BigInt("2")]];
          const output = `0${NEWLINE}1${NEWLINE}2${NEWLINE}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "Targeted value: boolean",
        fn() {
          const columns = [0];
          const data = [[true], [false]];
          const output = `0${NEWLINE}true${NEWLINE}false${NEWLINE}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "Targeted value: string",
        fn() {
          const columns = [0];
          const data = [["foo"], ["bar"]];
          const output = `0${NEWLINE}foo${NEWLINE}bar${NEWLINE}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "Targeted value: symbol",
        fn() {
          const columns = [0];
          const data = [[Symbol("foo")], [Symbol("bar")]];
          const output =
            `0${NEWLINE}Symbol(foo)${NEWLINE}Symbol(bar)${NEWLINE}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "Targeted value: function",
        fn() {
          const columns = [0];
          const data = [[(n: number) => n]];
          const output = `0${NEWLINE}(n)=>n${NEWLINE}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "Value with double quote",
        fn() {
          const columns = [0];
          const data = [['foo"']];
          const output = `0${NEWLINE}"foo"""${NEWLINE}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "Value with CRLF",
        fn() {
          const columns = [0];
          const data = [["foo\r\n"]];
          const output = `0${NEWLINE}"foo\r\n"${NEWLINE}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "Value with CR",
        fn() {
          const columns = [0];
          const data = [["foo\r"]];
          const output = `0${NEWLINE}foo\r${NEWLINE}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "Value with LF",
        fn() {
          const columns = [0];
          const data = [["foo\n"]];
          const output = `0${NEWLINE}foo\n${NEWLINE}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "Value with comma",
        fn() {
          const columns = [0];
          const data = [["foo,"]];
          const output = `0${NEWLINE}"foo,"${NEWLINE}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "Value with comma, tab separator",
        fn() {
          const columns = [0];
          const data = [["foo,"]];
          const output = `0${NEWLINE}foo,${NEWLINE}`;

          const options = { separator: "\t", columns };
          assertEquals(stringify(data, options), output);
        },
      },
    );
    await t.step({
      name: "Valid data, no columns",
      async fn() {
        const data = [[1, 2, 3], [4, 5, 6]];
        const output = `${NEWLINE}1,2,3${NEWLINE}4,5,6${NEWLINE}`;

        assertEquals(await stringify(data), output);
      },
    });
  },
});
