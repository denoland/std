// Test ported from Golang
// https://github.com/golang/go/blob/2cc15b1/src/encoding/csv/reader_test.go
// Copyright 2011 The Go Authors. All rights reserved. BSD license.
// https://github.com/golang/go/blob/master/LICENSE
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import {
  assert,
  assertEquals,
  assertStringIncludes,
  assertThrows,
} from "../assert/mod.ts";
import { stringify, StringifyError } from "./stringify.ts";

const LF = "\n";
const BYTE_ORDER_MARK = "\ufeff";

Deno.test({
  name: "stringify() handles various inputs",
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
        name: "Example array",
        fn() {
          const data = [[1, 2, 3]];
          const output = `${LF}1,2,3${LF}`;
          console.log(JSON.stringify(stringify(data)));

          assertEquals(stringify(data), output);
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
          const output = LF;
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
          const output = `a${LF}`;
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
          const output = `0\r1${LF}foo\rbar${LF}baz\rqux${LF}`;
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
          const output = `0\n1${LF}foo\nbar${LF}baz\nqux${LF}`;
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
          const output = `1${LF}1${LF}2${LF}`;
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
          const output = `foo${LF}bar${LF}`;
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
          const output = `1${LF}foo${LF}bar${LF}`;
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
          const output = `1${LF}1${LF}2${LF}`;
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
          const output = `1${LF}foo${LF}bar${LF}`;
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
          const output = `1${LF}foo${LF}bar${LF}`;
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
          const output = `value${LF}foo${LF}bar${LF}`;
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
          const output = `value${LF}foo${LF}bar${LF}`;
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
          const output = `value${LF}foo${LF}bar${LF}`;
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
          const output = `Value${LF}foo${LF}bar${LF}`;
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
            `0${LF}"{""value"":""foo""}"${LF}"{""value"":""bar""}"${LF}`;
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
            `0${LF}"[{""value"":""foo""},{""value"":""bar""}]"${LF}"[{""value"":""baz""},{""value"":""qux""}]"${LF}`;
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
            `0${LF}"[""foo"",""bar""]"${LF}"[""baz"",""qux""]"${LF}`;
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
            `0${LF}"[""foo"",""bar""]"${LF}"[""baz"",""qux""]"${LF}`;
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
          const output = `0${LF}${LF}${LF}`;
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
          const output = `0${LF}${LF}${LF}`;
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
          const output = `0${LF}10${LF}11${LF}`;
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
          const output = `0${LF}1${LF}2${LF}`;
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
          const output = `0${LF}true${LF}false${LF}`;
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
          const output = `0${LF}foo${LF}bar${LF}`;
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
          const output = `0${LF}Symbol(foo)${LF}Symbol(bar)${LF}`;
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
          const output = `0${LF}(n)=>n${LF}`;
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
          const output = `0${LF}"foo"""${LF}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "Value with LF",
        fn() {
          const columns = [0];
          const data = [["foo\r\n"]];
          const output = `0${LF}"foo\r\n"${LF}`;
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
          const output = `0${LF}foo\r${LF}`;
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
          const output = `0${LF}"foo\n"${LF}`;
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
          const output = `0${LF}"foo,"${LF}`;
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
          const output = `0${LF}foo,${LF}`;

          const options = { separator: "\t", columns };
          assertEquals(stringify(data, options), output);
        },
      },
    );
    await t.step({
      name: "Valid data, no columns",
      fn() {
        const data = [[1, 2, 3], [4, 5, 6]];
        const output = `${LF}1,2,3${LF}4,5,6${LF}`;

        assertEquals(stringify(data), output);
      },
    });
    await t.step(
      {
        name: "byte-order mark with bom=true",
        fn() {
          const data = [["abc"]];
          const output = `${BYTE_ORDER_MARK}abc${LF}`;
          const options = { headers: false, bom: true };
          assertStringIncludes(stringify(data, options), BYTE_ORDER_MARK);
          assertEquals(stringify(data, options), output);
        },
      },
    );
    await t.step(
      {
        name: "no byte-order mark with omitted bom option",
        fn() {
          const data = [["abc"]];
          const output = `abc${LF}`;
          const options = { headers: false };
          assert(!stringify(data, options).includes(BYTE_ORDER_MARK));
          assertEquals(stringify(data, options), output);
        },
      },
    );
    await t.step(
      {
        name: "no byte-order mark with bom=false",
        fn() {
          const data = [["abc"]];
          const output = `abc${LF}`;
          const options = { headers: false, bom: false };
          assert(!stringify(data, options).includes(BYTE_ORDER_MARK));
          assertEquals(stringify(data, options), output);
        },
      },
    );
  },
});
