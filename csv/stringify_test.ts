// Test ported from Golang
// https://github.com/golang/go/blob/2cc15b1/src/encoding/csv/reader_test.go
// Copyright 2011 The Go Authors. All rights reserved. BSD license.
// https://github.com/golang/go/blob/master/LICENSE
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import {
  assert,
  assertEquals,
  assertStringIncludes,
  assertThrows,
} from "../assert/mod.ts";
import { stringify, StringifyError } from "./stringify.ts";

const CRLF = "\r\n";
const BYTE_ORDER_MARK = "\ufeff";

Deno.test({
  name: "stringify()",
  async fn(t) {
    await t.step({
      name: "handles access array index using string",
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
        name: "handles double quote in separator",

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
        name: "handles CRLF in separator",
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
        name: "handles invalid data, no columns",
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
        name: "handles invalid data, no columns",
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
        name: "handles no data, no columns",

        fn() {
          const columns: string[] = [];
          const data: string[][] = [];
          const output = CRLF;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "handles no data, no columns, no headers",
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
        name: "handles no data, columns",
        fn() {
          const columns = ["a"];
          const data: string[][] = [];
          const output = `a${CRLF}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "handles no data, columns, no headers",

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
        name: "handles CR separator",
        fn() {
          const columns = [0, 1];
          const data = [["foo", "bar"], ["baz", "qux"]];
          const output = `0\r1${CRLF}foo\rbar${CRLF}baz\rqux${CRLF}`;
          const options = { separator: "\r", columns };
          assertEquals(stringify(data, options), output);
        },
      },
    );
    await t.step(
      {
        name: "handles LF separator",

        fn() {
          const columns = [0, 1];
          const data = [["foo", "bar"], ["baz", "qux"]];
          const output = `0\n1${CRLF}foo\nbar${CRLF}baz\nqux${CRLF}`;
          const options = { separator: "\n", columns };
          assertEquals(stringify(data, options), output);
        },
      },
    );
    await t.step(
      {
        name: "handles number accessor column",
        fn() {
          const columns = [1];
          const data = [{ 1: 1 }, { 1: 2 }];
          const output = `1${CRLF}1${CRLF}2${CRLF}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "handles explicit header value, no headers",

        fn() {
          const columns = [{ header: "Value", prop: "value" }];
          const data = [{ value: "foo" }, { value: "bar" }];
          const output = `foo${CRLF}bar${CRLF}`;
          const options = { headers: false, columns };
          assertEquals(stringify(data, options), output);
        },
      },
    );
    await t.step(
      {
        name: "handles number accessor,const data = array column",
        fn() {
          const columns = [1];
          const data = [["key", "foo"], ["key", "bar"]];
          const output = `1${CRLF}foo${CRLF}bar${CRLF}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "handles array number accessor column",

        fn() {
          const columns = [[1]];
          const data = [{ 1: 1 }, { 1: 2 }];
          const output = `1${CRLF}1${CRLF}2${CRLF}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "handles array number accessor,const data = array column",
        fn() {
          const columns = [[1]];
          const data = [["key", "foo"], ["key", "bar"]];
          const output = `1${CRLF}foo${CRLF}bar${CRLF}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "handles array number accessor,const data = array column",

        fn() {
          const columns = [[1, 1]];
          const data = [["key", ["key", "foo"]], ["key", ["key", "bar"]]];
          const output = `1${CRLF}foo${CRLF}bar${CRLF}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "handles string accessor column",
        fn() {
          const columns = ["value"];
          const data = [{ value: "foo" }, { value: "bar" }];
          const output = `value${CRLF}foo${CRLF}bar${CRLF}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "handles array string accessor column",
        fn() {
          const columns = [["value"]];
          const data = [{ value: "foo" }, { value: "bar" }];
          const output = `value${CRLF}foo${CRLF}bar${CRLF}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "handles array string accessor column",
        fn() {
          const columns = [["msg", "value"]];
          const data = [{ msg: { value: "foo" } }, { msg: { value: "bar" } }];
          const output = `value${CRLF}foo${CRLF}bar${CRLF}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "handles explicit header",
        fn() {
          const columns = [
            {
              header: "Value",
              prop: ["msg", "value"],
            },
          ];
          const data = [{ msg: { value: "foo" } }, { msg: { value: "bar" } }];
          const output = `Value${CRLF}foo${CRLF}bar${CRLF}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );

    await t.step(
      {
        name: "handles object",
        fn() {
          const columns = [0];
          const data = [[{ value: "foo" }], [{ value: "bar" }]];
          const output =
            `0${CRLF}"{""value"":""foo""}"${CRLF}"{""value"":""bar""}"${CRLF}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "handles arary of objects",
        fn() {
          const columns = [0];
          const data = [
            [[{ value: "foo" }, { value: "bar" }]],
            [[{ value: "baz" }, { value: "qux" }]],
          ];
          const output =
            `0${CRLF}"[{""value"":""foo""},{""value"":""bar""}]"${CRLF}"[{""value"":""baz""},{""value"":""qux""}]"${CRLF}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "handles array",
        fn() {
          const columns = [0];
          const data = [[["foo", "bar"]], [["baz", "qux"]]];
          const output =
            `0${CRLF}"[""foo"",""bar""]"${CRLF}"[""baz"",""qux""]"${CRLF}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "handles array, separator: tab",

        fn() {
          const columns = [0];
          const data = [[["foo", "bar"]], [["baz", "qux"]]];
          const output =
            `0${CRLF}"[""foo"",""bar""]"${CRLF}"[""baz"",""qux""]"${CRLF}`;
          const options = { separator: "\t", columns };
          assertEquals(stringify(data, options), output);
        },
      },
    );
    await t.step(
      {
        name: "handles undefined",
        fn() {
          const columns = [0];
          const data = [[], []];
          const output = `0${CRLF}${CRLF}${CRLF}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "handles null",
        fn() {
          const columns = [0];
          const data = [[null], [null]];
          const output = `0${CRLF}${CRLF}${CRLF}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "handles hex number",
        fn() {
          const columns = [0];
          const data = [[0xa], [0xb]];
          const output = `0${CRLF}10${CRLF}11${CRLF}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "handles BigInt",
        fn() {
          const columns = [0];
          const data = [[BigInt("1")], [BigInt("2")]];
          const output = `0${CRLF}1${CRLF}2${CRLF}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "handles boolean",
        fn() {
          const columns = [0];
          const data = [[true], [false]];
          const output = `0${CRLF}true${CRLF}false${CRLF}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "handles string",
        fn() {
          const columns = [0];
          const data = [["foo"], ["bar"]];
          const output = `0${CRLF}foo${CRLF}bar${CRLF}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "handles symbol",
        fn() {
          const columns = [0];
          const data = [[Symbol("foo")], [Symbol("bar")]];
          const output = `0${CRLF}Symbol(foo)${CRLF}Symbol(bar)${CRLF}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "handles function",
        fn() {
          const columns = [0];
          const data = [[(n: number) => n]];
          const output = `0${CRLF}(n)=>n${CRLF}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "handles value with double quote",
        fn() {
          const columns = [0];
          const data = [['foo"']];
          const output = `0${CRLF}"foo"""${CRLF}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "handles value with CRLF",
        fn() {
          const columns = [0];
          const data = [["foo\r\n"]];
          const output = `0${CRLF}"foo\r\n"${CRLF}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "handles value with CR",
        fn() {
          const columns = [0];
          const data = [["foo\r"]];
          const output = `0${CRLF}foo\r${CRLF}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "handles value with LF",
        fn() {
          const columns = [0];
          const data = [["foo\n"]];
          const output = `0${CRLF}"foo\n"${CRLF}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "handles value with comma",
        fn() {
          const columns = [0];
          const data = [["foo,"]];
          const output = `0${CRLF}"foo,"${CRLF}`;
          assertEquals(stringify(data, { columns }), output);
        },
      },
    );
    await t.step(
      {
        name: "handles value with comma, tab separator",
        fn() {
          const columns = [0];
          const data = [["foo,"]];
          const output = `0${CRLF}foo,${CRLF}`;

          const options = { separator: "\t", columns };
          assertEquals(stringify(data, options), output);
        },
      },
    );
    await t.step({
      name: "handles valid data, no columns",
      fn() {
        const data = [[1, 2, 3], [4, 5, 6]];
        const output = `${CRLF}1,2,3${CRLF}4,5,6${CRLF}`;

        assertEquals(stringify(data), output);
      },
    });
    await t.step(
      {
        name: "handles byte-order mark with bom=true",
        fn() {
          const data = [["abc"]];
          const output = `${BYTE_ORDER_MARK}abc${CRLF}`;
          const options = { headers: false, bom: true };
          assertStringIncludes(stringify(data, options), BYTE_ORDER_MARK);
          assertEquals(stringify(data, options), output);
        },
      },
    );
    await t.step(
      {
        name: "handles no byte-order mark with omitted bom option",
        fn() {
          const data = [["abc"]];
          const output = `abc${CRLF}`;
          const options = { headers: false };
          assert(!stringify(data, options).includes(BYTE_ORDER_MARK));
          assertEquals(stringify(data, options), output);
        },
      },
    );
    await t.step(
      {
        name: "handles no byte-order mark with bom=false",
        fn() {
          const data = [["abc"]];
          const output = `abc${CRLF}`;
          const options = { headers: false, bom: false };
          assert(!stringify(data, options).includes(BYTE_ORDER_MARK));
          assertEquals(stringify(data, options), output);
        },
      },
    );
  },
});
