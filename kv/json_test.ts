// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import {
  assert,
  assertEquals,
  assertStrictEquals,
  assertThrows,
} from "@std/assert";
import { timingSafeEqual } from "@std/crypto/timing-safe-equal";

import {
  entryMaybeToJSON,
  entryToJSON,
  keyPartToJSON,
  keyToJSON,
  toEntry,
  toEntryMaybe,
  toKey,
  toKeyPart,
  toValue,
  valueToJSON,
} from "./json.ts";

Deno.test({
  name: "toValue - ArrayBuffer",
  fn() {
    assert(
      timingSafeEqual(
        toValue({ type: "ArrayBuffer", value: "AQID" }),
        new Uint8Array([1, 2, 3]).buffer,
      ),
    );
  },
});

Deno.test({
  name: "toValue - Array",
  fn() {
    assertEquals(
      toValue({
        type: "Array",
        value: [
          { type: "number", value: 1 },
          { type: "number", value: 2 },
          { type: "number", value: 3 },
        ],
      }),
      [1, 2, 3],
    );
  },
});

Deno.test({
  name: "toValue - bigint",
  fn() {
    assertEquals(toValue({ type: "bigint", value: "100" }), 100n);
  },
});

Deno.test({
  name: "toValue - boolean",
  fn() {
    assertEquals(toValue({ type: "boolean", value: true }), true);
  },
});

Deno.test({
  name: "toValue - DataView",
  fn() {
    assert(
      timingSafeEqual(
        toValue({ type: "DataView", value: "AQID" }),
        new DataView(new Uint8Array([1, 2, 3]).buffer),
      ),
    );
  },
});

Deno.test({
  name: "toValue - Date",
  fn() {
    const actual = toValue({ type: "Date", value: "2023-12-16T17:24:00.000Z" });
    assert(actual instanceof Date);
    assertEquals(actual.toISOString(), "2023-12-16T17:24:00.000Z");
  },
});

Deno.test({
  name: "toValue - Error",
  fn() {
    const value = toValue({
      type: "Error",
      value: {
        message: "an error",
        stack: `Line\nLine`,
        cause: {
          type: "SyntaxError",
          value: { message: "something else", stack: "Line\nLine" },
        },
      },
    });
    assert(value instanceof Error);
    assertEquals(value.message, "an error");
    assertEquals(value.stack, `Line\nLine`);
    assert(value.cause instanceof SyntaxError);
  },
});

Deno.test({
  name: "toValue - EvalError",
  fn() {
    const value = toValue({
      type: "EvalError",
      value: { message: "an error", stack: `Line\nLine` },
    });
    assert(value instanceof EvalError);
    assertEquals(value.message, "an error");
    assertEquals(value.stack, `Line\nLine`);
  },
});

Deno.test({
  name: "toValue - RangeError",
  fn() {
    const value = toValue({
      type: "RangeError",
      value: { message: "an error", stack: `Line\nLine` },
    });
    assert(value instanceof RangeError);
    assertEquals(value.message, "an error");
    assertEquals(value.stack, `Line\nLine`);
  },
});

Deno.test({
  name: "toValue - ReferenceError",
  fn() {
    const value = toValue({
      type: "ReferenceError",
      value: { message: "an error", stack: `Line\nLine` },
    });
    assert(value instanceof ReferenceError);
    assertEquals(value.message, "an error");
    assertEquals(value.stack, `Line\nLine`);
  },
});

Deno.test({
  name: "toValue - SyntaxError",
  fn() {
    const value = toValue({
      type: "SyntaxError",
      value: { message: "an error", stack: `Line\nLine` },
    });
    assert(value instanceof SyntaxError);
    assertEquals(value.message, "an error");
    assertEquals(value.stack, `Line\nLine`);
  },
});

Deno.test({
  name: "toValue - TypeError",
  fn() {
    const value = toValue({
      type: "TypeError",
      value: { message: "an error", stack: `Line\nLine` },
    });
    assert(value instanceof TypeError);
    assertEquals(value.message, "an error");
    assertEquals(value.stack, `Line\nLine`);
  },
});

Deno.test({
  name: "toValue - URIError",
  fn() {
    const value = toValue({
      type: "URIError",
      value: { message: "an error", stack: `Line\nLine` },
    });
    assert(value instanceof URIError);
    assertEquals(value.message, "an error");
    assertEquals(value.stack, `Line\nLine`);
  },
});

Deno.test({
  name: "toValue - Deno.KvU64",
  fn() {
    const actual = toValue({ type: "KvU64", value: "100" });
    assert(actual instanceof Deno.KvU64);
    assertEquals(actual.value, new Deno.KvU64(100n).value);
  },
});

Deno.test({
  name: "toValue - Map",
  fn() {
    const actual = toValue({
      type: "Map",
      value: [[
        { type: "string", value: "key" },
        { type: "string", value: "value" },
      ], [
        { type: "string", value: "key2" },
        { type: "string", value: "value2" },
      ]],
    });
    assert(actual instanceof Map);
    assertEquals(actual.size, 2);
    assertEquals(actual.get("key"), "value");
  },
});

Deno.test({
  name: "toValue - null",
  fn() {
    assertStrictEquals(toValue({ type: "null", value: null }), null);
  },
});

Deno.test({
  name: "toValue - number",
  fn() {
    assertStrictEquals(toValue({ type: "number", value: 1.23 }), 1.23);
  },
});

Deno.test({
  name: "toValue - object",
  fn() {
    assertEquals(
      toValue({
        type: "object",
        value: { foo: { type: "string", value: "bar" } },
      }),
      {
        foo: "bar",
      },
    );
  },
});

Deno.test({
  name: "toValue - RegExp",
  fn() {
    assertEquals(
      toValue({ type: "RegExp", value: "/abc/i" }).toString(),
      "/abc/i",
    );
  },
});

Deno.test({
  name: "toValue - Set",
  fn() {
    const actual = toValue({
      type: "Set",
      value: [
        { type: "number", value: 1 },
        { type: "number", value: 2 },
        { type: "number", value: 3 },
      ],
    });
    assert(actual instanceof Set);
    assertEquals(actual.size, 3);
    assert(actual.has(1));
  },
});

Deno.test({
  name: "toValue - string",
  fn() {
    assertEquals(toValue({ type: "string", value: "foo" }), "foo");
  },
});

Deno.test({
  name: "toValue - Int8Array",
  fn() {
    const actual = toValue({ type: "Int8Array", value: "AQID" });
    assert(actual instanceof Int8Array);
    assert(timingSafeEqual(actual, new Uint8Array([1, 2, 3])));
  },
});

Deno.test({
  name: "toValue - Uint8Array",
  fn() {
    const actual = toValue({ type: "Uint8Array", value: "AQID" });
    assert(actual instanceof Uint8Array);
    assert(timingSafeEqual(actual, new Uint8Array([1, 2, 3])));
  },
});

Deno.test({
  name: "toValue - Uint8ClampedArray",
  fn() {
    const actual = toValue({ type: "Uint8ClampedArray", value: "AQID" });
    assert(actual instanceof Uint8ClampedArray);
    assert(timingSafeEqual(actual, new Uint8Array([1, 2, 3])));
  },
});

Deno.test({
  name: "toValue - Int16Array",
  fn() {
    const actual = toValue({ type: "Int16Array", value: "AQIDBA" });
    assert(actual instanceof Int16Array);
    assert(timingSafeEqual(actual, new Uint8Array([1, 2, 3, 4])));
  },
});

Deno.test({
  name: "toValue - Uint16Array",
  fn() {
    const actual = toValue({ type: "Uint16Array", value: "AQIDBA" });
    assert(actual instanceof Uint16Array);
    assert(timingSafeEqual(actual, new Uint8Array([1, 2, 3, 4])));
  },
});

Deno.test({
  name: "toValue - Int32Array",
  fn() {
    const actual = toValue({ type: "Int32Array", value: "AQIDBA" });
    assert(actual instanceof Int32Array);
    assert(timingSafeEqual(actual, new Uint8Array([1, 2, 3, 4])));
  },
});

Deno.test({
  name: "toValue - Uint32Array",
  fn() {
    const actual = toValue({ type: "Uint32Array", value: "AQIDBA" });
    assert(actual instanceof Uint32Array);
    assert(timingSafeEqual(actual, new Uint8Array([1, 2, 3, 4])));
  },
});

Deno.test({
  name: "toValue - Float32Array",
  fn() {
    const actual = toValue({ type: "Float32Array", value: "mpmZP5qZWUAzM7NA" });
    assert(actual instanceof Float32Array);
    assert(timingSafeEqual(actual, new Float32Array([1.2, 3.4, 5.6])));
  },
});

Deno.test({
  name: "toValue - Float64Array",
  fn() {
    const actual = toValue({
      type: "Float64Array",
      value: "MzMzMzMz8z8zMzMzMzMLQGZmZmZmZhZA",
    });
    assert(actual instanceof Float64Array);
    assert(timingSafeEqual(actual, new Float64Array([1.2, 3.4, 5.6])));
  },
});

Deno.test({
  name: "toValue - BigInt64Array",
  fn() {
    const actual = toValue({
      type: "BigInt64Array",
      value: "AQAAAAAAAAACAAAAAAAAAAMAAAAAAAAA",
    });
    assert(actual instanceof BigInt64Array);
    assert(timingSafeEqual(actual, new BigInt64Array([1n, 2n, 3n])));
  },
});

Deno.test({
  name: "toValue - BigUint64Array",
  fn() {
    const actual = toValue({
      type: "BigUint64Array",
      value: "AQAAAAAAAAACAAAAAAAAAAMAAAAAAAAA",
    });
    assert(actual instanceof BigUint64Array);
    assert(timingSafeEqual(actual, new BigUint64Array([1n, 2n, 3n])));
  },
});

Deno.test({
  name: "toValue - undefined",
  fn() {
    assertStrictEquals(toValue({ type: "undefined" }), undefined);
  },
});

Deno.test({
  name: "toValue - throws TypeError on unknown type",
  fn() {
    assertThrows(
      // deno-lint-ignore no-explicit-any
      () => toValue({ type: "unknown" } as any),
      TypeError,
      'Unexpected value type: "unknown"',
    );
  },
});

Deno.test({
  name: "valueToJSON - ArrayBuffer",
  fn() {
    const ab = new Uint8Array([1, 2, 3]).buffer;
    const actual = valueToJSON(ab);
    assertEquals(actual, {
      type: "ArrayBuffer",
      value: "AQID",
    });
  },
});

Deno.test({
  name: "valueToJSON - Array",
  fn() {
    const actual = valueToJSON([1, 2, 3]);
    assertEquals(actual, {
      type: "Array",
      value: [
        { type: "number", value: 1 },
        { type: "number", value: 2 },
        { type: "number", value: 3 },
      ],
    });
  },
});

Deno.test({
  name: "valueToJSON - bigint",
  fn() {
    const actual = valueToJSON(100n);
    assertEquals(actual, {
      type: "bigint",
      value: "100",
    });
  },
});

Deno.test({
  name: "valueToJSON - boolean",
  fn() {
    const actual = valueToJSON(false);
    assertEquals(actual, {
      type: "boolean",
      value: false,
    });
  },
});

Deno.test({
  name: "valueToJSON - DataView",
  fn() {
    const dataView = new DataView(new Uint8Array([1, 2, 3]).buffer);
    const actual = valueToJSON(dataView);
    assertEquals(actual, {
      type: "DataView",
      value: "AQID",
    });
  },
});

Deno.test({
  name: "valueToJSON - Date",
  fn() {
    const actual = valueToJSON(new Date("2023-12-16T17:24:00.000Z"));
    assertEquals(actual, {
      type: "Date",
      value: "2023-12-16T17:24:00.000Z",
    });
  },
});

Deno.test({
  name: "valueToJSON - Error",
  fn() {
    const actual = valueToJSON(
      new Error("something", { cause: new SyntaxError("else") }),
    );
    assertEquals(actual.type, "Error");
    assertEquals(actual.value.message, "something");
    assert(actual.value.stack);
    assertEquals(actual.value.cause?.type, "SyntaxError");
  },
});

Deno.test({
  name: "valueToJSON - custom Error",
  fn() {
    class CustomError extends Error {}
    const actual = valueToJSON(
      new CustomError("something"),
    );
    assertEquals(actual.type, "Error");
    assertEquals(actual.value.message, "something");
    assert(actual.value.stack);
  },
});

Deno.test({
  name: "valueToJSON - EvalError",
  fn() {
    const actual = valueToJSON(new EvalError("something"));
    assertEquals(actual.type, "EvalError");
    assertEquals(actual.value.message, "something");
    assert(actual.value.stack);
  },
});

Deno.test({
  name: "valueToJSON - RangeError",
  fn() {
    const actual = valueToJSON(new RangeError("something"));
    assertEquals(actual.type, "RangeError");
    assertEquals(actual.value.message, "something");
    assert(actual.value.stack);
  },
});

Deno.test({
  name: "valueToJSON - ReferenceError",
  fn() {
    const actual = valueToJSON(new ReferenceError("something"));
    assertEquals(actual.type, "ReferenceError");
    assertEquals(actual.value.message, "something");
    assert(actual.value.stack);
  },
});

Deno.test({
  name: "valueToJSON - SyntaxError",
  fn() {
    const actual = valueToJSON(new SyntaxError("something"));
    assertEquals(actual.type, "SyntaxError");
    assertEquals(actual.value.message, "something");
    assert(actual.value.stack);
  },
});

Deno.test({
  name: "valueToJSON - TypeError",
  fn() {
    const actual = valueToJSON(new TypeError("something"));
    assertEquals(actual.type, "TypeError");
    assertEquals(actual.value.message, "something");
    assert(actual.value.stack);
  },
});

Deno.test({
  name: "valueToJSON - URIError",
  fn() {
    const actual = valueToJSON(new URIError("something"));
    assertEquals(actual.type, "URIError");
    assertEquals(actual.value.message, "something");
    assert(actual.value.stack);
  },
});

Deno.test({
  name: "valueToJSON - KvU64",
  fn() {
    const actual = valueToJSON(new Deno.KvU64(100n));
    assertEquals(actual, {
      type: "KvU64",
      value: "100",
    });
  },
});

Deno.test({
  name: "valueToJSON - Map",
  fn() {
    const actual = valueToJSON(new Map([["key", "value"]]));
    assertEquals(actual, {
      type: "Map",
      value: [
        [{ type: "string", value: "key" }, { type: "string", value: "value" }],
      ],
    });
  },
});

Deno.test({
  name: "valueToJSON - null",
  fn() {
    const actual = valueToJSON(null);
    assertEquals(actual, {
      type: "null",
      value: null,
    });
  },
});

Deno.test({
  name: "valueToJSON - number",
  fn() {
    const actual = valueToJSON(123);
    assertEquals(actual, {
      type: "number",
      value: 123,
    });
  },
});

Deno.test({
  name: "valueToJSON - RegExp",
  fn() {
    const actual = valueToJSON(/match/);
    assertEquals(actual, {
      type: "RegExp",
      value: "/match/",
    });
  },
});

Deno.test({
  name: "valueToJSON - RegExp with flags",
  fn() {
    const actual = valueToJSON(/match/i);
    assertEquals(actual, {
      type: "RegExp",
      value: "/match/i",
    });
  },
});

Deno.test({
  name: "valueToJSON - Set",
  fn() {
    const actual = valueToJSON(new Set([1, 2, 3]));
    assertEquals(actual, {
      type: "Set",
      value: [
        { type: "number", value: 1 },
        { type: "number", value: 2 },
        { type: "number", value: 3 },
      ],
    });
  },
});

Deno.test({
  name: "valueToJSON - String",
  fn() {
    const actual = valueToJSON("a string");
    assertEquals(actual, {
      type: "string",
      value: "a string",
    });
  },
});

Deno.test({
  name: "valueToJSON - Int8Array",
  fn() {
    const actual = valueToJSON(new Int8Array([1, 2, 3]));
    assertEquals(actual, {
      type: "Int8Array",
      value: "AQID",
    });
  },
});

Deno.test({
  name: "valueToJSON - Uint8Array",
  fn() {
    const actual = valueToJSON(new Uint8Array([1, 2, 3]));
    assertEquals(actual, {
      type: "Uint8Array",
      value: "AQID",
    });
  },
});

Deno.test({
  name: "valueToJSON - Uint8ClampedArray",
  fn() {
    const actual = valueToJSON(new Uint8ClampedArray([1, 2, 3]));
    assertEquals(actual, {
      type: "Uint8ClampedArray",
      value: "AQID",
    });
  },
});

Deno.test({
  name: "valueToJSON - Int16Array",
  fn() {
    const actual = valueToJSON(new Int16Array([1, 2, 3, 4]));
    assertEquals(actual, {
      type: "Int16Array",
      value: "AQACAAMABAA",
    });
  },
});

Deno.test({
  name: "valueToJSON - Uint16Array",
  fn() {
    const actual = valueToJSON(new Uint16Array([1, 2, 3, 4]));
    assertEquals(actual, {
      type: "Uint16Array",
      value: "AQACAAMABAA",
    });
  },
});

Deno.test({
  name: "valueToJSON - Int32Array",
  fn() {
    const actual = valueToJSON(new Int32Array([1, 2, 3, 4]));
    assertEquals(actual, {
      type: "Int32Array",
      value: "AQAAAAIAAAADAAAABAAAAA",
    });
  },
});

Deno.test({
  name: "valueToJSON - Uint32Array",
  fn() {
    const actual = valueToJSON(new Uint32Array([1, 2, 3, 4]));
    assertEquals(actual, {
      type: "Uint32Array",
      value: "AQAAAAIAAAADAAAABAAAAA",
    });
  },
});

Deno.test({
  name: "valueToJSON - Float32Array",
  fn() {
    const actual = valueToJSON(new Float32Array([1.2, 3.4, 5.6]));
    assertEquals(actual, {
      type: "Float32Array",
      value: "mpmZP5qZWUAzM7NA",
    });
  },
});

Deno.test({
  name: "valueToJSON - Float64Array",
  fn() {
    const actual = valueToJSON(new Float64Array([1.2, 3.4, 5.6]));
    assertEquals(actual, {
      type: "Float64Array",
      value: "MzMzMzMz8z8zMzMzMzMLQGZmZmZmZhZA",
    });
  },
});

Deno.test({
  name: "valueToJSON - BigInt64Array",
  fn() {
    const actual = valueToJSON(new BigInt64Array([1n, 2n, 3n]));
    assertEquals(actual, {
      type: "BigInt64Array",
      value: "AQAAAAAAAAACAAAAAAAAAAMAAAAAAAAA",
    });
  },
});

Deno.test({
  name: "valueToJSON - BigUint64Array",
  fn() {
    const actual = valueToJSON(new BigUint64Array([1n, 2n, 3n]));
    assertEquals(actual, {
      type: "BigUint64Array",
      value: "AQAAAAAAAAACAAAAAAAAAAMAAAAAAAAA",
    });
  },
});

Deno.test({
  name: "valueToJSON - undefined",
  fn() {
    const actual = valueToJSON(undefined);
    assertEquals(actual, {
      type: "undefined",
    });
  },
});

Deno.test({
  name: "valueToJSON - object",
  fn() {
    const actual = valueToJSON({ key: "value" });
    assertEquals(actual, {
      type: "object",
      value: { key: { type: "string", value: "value" } },
    });
  },
});

Deno.test({
  name: "keyPartToJSON - Uint8Array",
  fn() {
    const actual = keyPartToJSON(new Uint8Array([1, 2, 3]));
    assertEquals(actual, {
      type: "Uint8Array",
      value: "AQID",
    });
  },
});

Deno.test({
  name: "keyPartToJSON - string",
  fn() {
    const actual = keyPartToJSON("a");
    assertEquals(actual, {
      type: "string",
      value: "a",
    });
  },
});

Deno.test({
  name: "keyPartToJSON - number",
  fn() {
    const actual = keyPartToJSON(1);
    assertEquals(actual, {
      type: "number",
      value: 1,
    });
  },
});

Deno.test({
  name: "keyPartToJSON - number - Infinity",
  fn() {
    const actual = JSON.parse(JSON.stringify(keyPartToJSON(Infinity)));
    assertEquals(actual, {
      type: "number",
      value: "Infinity",
    });
  },
});

Deno.test({
  name: "keyPartToJSON - number - -Infinity",
  fn() {
    const actual = JSON.parse(JSON.stringify(keyPartToJSON(-Infinity)));
    assertEquals(actual, {
      type: "number",
      value: "-Infinity",
    });
  },
});

Deno.test({
  name: "keyPartToJSON - number - NaN",
  fn() {
    const actual = JSON.parse(JSON.stringify(keyPartToJSON(NaN)));
    assertEquals(actual, {
      type: "number",
      value: "NaN",
    });
  },
});

Deno.test({
  name: "keyPartToJSON - bigint",
  fn() {
    const actual = keyPartToJSON(100n);
    assertEquals(actual, {
      type: "bigint",
      value: "100",
    });
  },
});

Deno.test({
  name: "keyPartToJSON - boolean",
  fn() {
    const actual = keyPartToJSON(true);
    assertEquals(actual, {
      type: "boolean",
      value: true,
    });
  },
});

Deno.test({
  name: "keyToJSON",
  fn() {
    const actual = keyToJSON(["a", 1, 100n]);
    assertEquals(actual, [
      { type: "string", value: "a" },
      { type: "number", value: 1 },
      { type: "bigint", value: "100" },
    ]);
  },
});

Deno.test({
  name: "toKeyPart - bigint",
  fn() {
    const actual = toKeyPart({ type: "bigint", value: "100" });
    assertEquals(actual, 100n);
  },
});

Deno.test({
  name: "toKeyPart - boolean",
  fn() {
    const actual = toKeyPart({ type: "boolean", value: true });
    assertEquals(actual, true);
  },
});

Deno.test({
  name: "toKeyPart - number",
  fn() {
    const actual = toKeyPart({ type: "number", value: 100 });
    assertEquals(actual, 100);
  },
});

Deno.test({
  name: "toKeyPart - number - Infinity",
  fn() {
    assertStrictEquals(
      toKeyPart({ type: "number", value: "Infinity" }),
      Infinity,
    );
  },
});

Deno.test({
  name: "toKeyPart - number - -Infinity",
  fn() {
    assertStrictEquals(
      toKeyPart({ type: "number", value: "-Infinity" }),
      -Infinity,
    );
  },
});

Deno.test({
  name: "toKeyPart - number - NaN",
  fn() {
    const actual = toKeyPart({ type: "number", value: "NaN" });
    assert(Number.isNaN(actual));
  },
});

Deno.test({
  name: "toKeyPart - string",
  fn() {
    const actual = toKeyPart({ type: "string", value: "a string" });
    assertEquals(actual, "a string");
  },
});

Deno.test({
  name: "toKeyPart - Uint8Array",
  fn() {
    const actual = toKeyPart({ type: "Uint8Array", value: "AQID" });
    assert(timingSafeEqual(actual, new Uint8Array([1, 2, 3])));
  },
});

Deno.test({
  name: "toKey",
  fn() {
    const actual = toKey([
      { type: "string", value: "a" },
      { type: "number", value: 1 },
      { type: "bigint", value: "100" },
    ]);
    assertEquals(actual, ["a", 1, 100n]);
  },
});

Deno.test({
  name: "toEntry",
  fn() {
    const actual = toEntry({
      key: [{ type: "string", value: "a" }],
      value: {
        type: "Array",
        value: [
          { type: "number", value: 1 },
          { type: "number", value: 2 },
          { type: "number", value: 3 },
        ],
      },
      versionstamp: "00000000",
    });
    assertEquals(actual, {
      key: ["a"],
      value: [1, 2, 3],
      versionstamp: "00000000",
    });
  },
});

Deno.test({
  name: "toEntryMaybe - entry",
  fn() {
    const actual = toEntryMaybe({
      key: [{ type: "string", value: "a" }],
      value: {
        type: "Array",
        value: [
          { type: "number", value: 1 },
          { type: "number", value: 2 },
          { type: "number", value: 3 },
        ],
      },
      versionstamp: "00000000",
    });
    assertEquals(actual, {
      key: ["a"],
      value: [1, 2, 3],
      versionstamp: "00000000",
    });
  },
});

Deno.test({
  name: "toEntryMaybe - no entry",
  fn() {
    const actual = toEntryMaybe({
      key: [{ type: "string", value: "a" }],
      value: null,
      versionstamp: null,
    });
    assertEquals(actual, {
      key: ["a"],
      value: null,
      versionstamp: null,
    });
  },
});

Deno.test({
  name: "entryToJSON",
  fn() {
    const actual = entryToJSON({
      key: ["a"],
      value: [1, 2, 3],
      versionstamp: "00000000",
    });
    assertEquals(actual, {
      key: [{ type: "string", value: "a" }],
      value: {
        type: "Array",
        value: [
          { type: "number", value: 1 },
          { type: "number", value: 2 },
          { type: "number", value: 3 },
        ],
      },
      versionstamp: "00000000",
    });
  },
});

Deno.test({
  name: "toEntry - entry",
  fn() {
    const actual = entryMaybeToJSON({
      key: ["a"],
      value: [1, 2, 3],
      versionstamp: "00000000",
    });
    assertEquals(actual, {
      key: [{ type: "string", value: "a" }],
      value: {
        type: "Array",
        value: [
          { type: "number", value: 1 },
          { type: "number", value: 2 },
          { type: "number", value: 3 },
        ],
      },
      versionstamp: "00000000",
    });
  },
});

Deno.test({
  name: "toEntry - no entry",
  fn() {
    const actual = entryMaybeToJSON({
      key: ["a"],
      value: null,
      versionstamp: null,
    });
    assertEquals(actual, {
      key: [{ type: "string", value: "a" }],
      value: null,
      versionstamp: null,
    });
  },
});
