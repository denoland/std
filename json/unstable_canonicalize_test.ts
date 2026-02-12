// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertThrows } from "@std/assert";
import { canonicalize, canonicalizeToBytes } from "./unstable_canonicalize.ts";

// RFC 8785 §3.2.2.1: Literals

Deno.test("canonicalize() serializes literals", () => {
  assertEquals(canonicalize(null), "null");
  assertEquals(canonicalize(true), "true");
  assertEquals(canonicalize(false), "false");
});

// RFC 8785 §3.2.2.2: Strings

Deno.test("canonicalize() serializes strings", () => {
  assertEquals(canonicalize(""), '""');
  assertEquals(canonicalize("hello"), '"hello"');
});

Deno.test("canonicalize() escapes mandatory characters in strings", () => {
  assertEquals(canonicalize('a"b'), '"a\\"b"');
  assertEquals(canonicalize("a\\b"), '"a\\\\b"');
});

Deno.test("canonicalize() uses two-character escape sequences", () => {
  assertEquals(canonicalize("a\bb"), '"a\\bb"');
  assertEquals(canonicalize("a\fb"), '"a\\fb"');
  assertEquals(canonicalize("a\nb"), '"a\\nb"');
  assertEquals(canonicalize("a\rb"), '"a\\rb"');
  assertEquals(canonicalize("a\tb"), '"a\\tb"');
});

Deno.test("canonicalize() escapes other control characters as \\uXXXX", () => {
  assertEquals(canonicalize("\x00"), '"\\u0000"');
  assertEquals(canonicalize("\x0f"), '"\\u000f"');
  assertEquals(canonicalize("\x1f"), '"\\u001f"');
});

Deno.test("canonicalize() does not escape forward slash", () => {
  assertEquals(canonicalize("a/b"), '"a/b"');
  assertEquals(
    canonicalize("https://example.com/path"),
    '"https://example.com/path"',
  );
});

Deno.test("canonicalize() preserves unicode characters without escaping", () => {
  assertEquals(canonicalize("こんにちは"), '"こんにちは"');
  assertEquals(canonicalize("€"), '"€"');
  assertEquals(canonicalize("🦕"), '"🦕"');
  assertEquals(canonicalize("emoji: 👪"), '"emoji: 👪"');
});

// RFC 8785 §3.2.2.3: Numbers

Deno.test("canonicalize() serializes zero and negative zero", () => {
  assertEquals(canonicalize(0), "0");
  assertEquals(canonicalize(-0), "0"); // RFC 8785: -0 → "0"
});

Deno.test("canonicalize() serializes integers", () => {
  assertEquals(canonicalize(1), "1");
  assertEquals(canonicalize(-1), "-1");
  assertEquals(canonicalize(123), "123");
  assertEquals(canonicalize(-123), "-123");
  assertEquals(canonicalize(9007199254740991), "9007199254740991");
  assertEquals(canonicalize(-9007199254740991), "-9007199254740991");
});

Deno.test("canonicalize() serializes decimals without trailing zeros", () => {
  assertEquals(canonicalize(1.5), "1.5");
  assertEquals(canonicalize(-1.5), "-1.5");
  assertEquals(canonicalize(0.5), "0.5");
  assertEquals(canonicalize(4.50), "4.5");
  assertEquals(canonicalize(10.0), "10");
});

Deno.test("canonicalize() uses ECMAScript number serialization (Appendix B)", () => {
  // RFC 8785 Appendix B test vectors
  assertEquals(canonicalize(333333333.33333329), "333333333.3333333");
  assertEquals(canonicalize(1E30), "1e+30");
  assertEquals(canonicalize(4.50), "4.5");
  assertEquals(canonicalize(2e-3), "0.002");
  assertEquals(canonicalize(0.000000000000000000000000001), "1e-27");
});

Deno.test("canonicalize() uses exponential notation boundaries", () => {
  assertEquals(canonicalize(1e20), "100000000000000000000");
  assertEquals(canonicalize(1e21), "1e+21");
  assertEquals(canonicalize(1e22), "1e+22");
  assertEquals(canonicalize(0.000001), "0.000001");
  assertEquals(canonicalize(0.0000001), "1e-7");
  assertEquals(canonicalize(1e-10), "1e-10");
});

Deno.test("canonicalize() throws on non-finite numbers", () => {
  assertThrows(
    () => canonicalize(NaN),
    TypeError,
    "Cannot canonicalize non-finite number",
  );
  assertThrows(
    () => canonicalize(Infinity),
    TypeError,
    "Cannot canonicalize non-finite number",
  );
  assertThrows(
    () => canonicalize(-Infinity),
    TypeError,
    "Cannot canonicalize non-finite number",
  );
});

// RFC 8785 §3.2.3: Object Property Sorting

Deno.test("canonicalize() handles empty object", () => {
  assertEquals(canonicalize({}), "{}");
});

Deno.test("canonicalize() sorts object keys by UTF-16 code units", () => {
  assertEquals(canonicalize({ z: 1, a: 2 }), '{"a":2,"z":1}');
  assertEquals(canonicalize({ c: 3, b: 2, a: 1 }), '{"a":1,"b":2,"c":3}');
  assertEquals(canonicalize({ a: 1, A: 2, "1": 3 }), '{"1":3,"A":2,"a":1}');
});

Deno.test("canonicalize() sorts unicode keys by UTF-16 code units", () => {
  assertEquals(canonicalize({ "€": 1, "$": 2 }), '{"$":2,"€":1}');
  assertEquals(canonicalize({ "ö": 1, "o": 2 }), '{"o":2,"ö":1}');
});

Deno.test("canonicalize() handles keys requiring escaping", () => {
  assertEquals(
    canonicalize({ 'key"with"quotes': 1 }),
    '{"key\\"with\\"quotes":1}',
  );
  assertEquals(
    canonicalize({ "key\nwith\nnewlines": 1 }),
    '{"key\\nwith\\nnewlines":1}',
  );
  assertEquals(canonicalize({ "": 1 }), '{"":1}');
});

Deno.test("canonicalize() omits undefined properties", () => {
  assertEquals(canonicalize({ a: 1, b: undefined, c: 3 }), '{"a":1,"c":3}');
});

Deno.test("canonicalize() handles object with all undefined properties", () => {
  assertEquals(
    canonicalize({ a: undefined, b: undefined, c: undefined }),
    "{}",
  );
});

Deno.test("canonicalize() recursively sorts nested objects", () => {
  const data = { b: { d: 4, c: 3 }, a: 1 };
  assertEquals(canonicalize(data), '{"a":1,"b":{"c":3,"d":4}}');
});

// Arrays

Deno.test("canonicalize() handles empty array", () => {
  assertEquals(canonicalize([]), "[]");
});

Deno.test("canonicalize() preserves array element order", () => {
  assertEquals(canonicalize([1, 2, 3]), "[1,2,3]");
  assertEquals(canonicalize([3, 1, 2]), "[3,1,2]");
  assertEquals(canonicalize(["a", "b", "c"]), '["a","b","c"]');
});

Deno.test("canonicalize() handles mixed type arrays", () => {
  assertEquals(canonicalize([1, "two", true, null]), '[1,"two",true,null]');
});

Deno.test("canonicalize() handles nested arrays", () => {
  assertEquals(canonicalize([[1, 2], [3, 4]]), "[[1,2],[3,4]]");
});

Deno.test("canonicalize() sorts objects within arrays", () => {
  assertEquals(
    canonicalize([{ z: 1, a: 2 }, { y: 3, b: 4 }]),
    '[{"a":2,"z":1},{"b":4,"y":3}]',
  );
});

Deno.test("canonicalize() converts undefined array elements to null", () => {
  // deno-lint-ignore no-explicit-any
  assertEquals(canonicalize([1, undefined, 3] as any), "[1,null,3]");
  // deno-lint-ignore no-explicit-any
  assertEquals(canonicalize([undefined] as any), "[null]");
  // deno-lint-ignore no-explicit-any
  assertEquals(canonicalize([undefined, undefined] as any), "[null,null]");
});

Deno.test("canonicalize() handles sparse arrays", () => {
  const sparse = new Array(3);
  sparse[0] = 1;
  sparse[2] = 3;
  // deno-lint-ignore no-explicit-any
  assertEquals(canonicalize(sparse as any), "[1,null,3]");
});

Deno.test("canonicalize() handles nested undefined in arrays", () => {
  // deno-lint-ignore no-explicit-any
  const nested = [{ a: 1 }, undefined, [undefined, 2]] as any;
  assertEquals(canonicalize(nested), '[{"a":1},null,[null,2]]');
});

// RFC 8785 §3.2.1: No Whitespace

Deno.test("canonicalize() produces output with no whitespace", () => {
  const data = { array: [1, 2, 3], nested: { a: 1, b: 2 } };
  const result = canonicalize(data);
  assertEquals(result.includes(" "), false);
  assertEquals(result.includes("\n"), false);
  assertEquals(result.includes("\t"), false);
  assertEquals(result.includes("\r"), false);
});

// Circular Reference Detection

Deno.test("canonicalize() throws on direct circular reference", () => {
  // deno-lint-ignore no-explicit-any
  const obj: any = { a: 1 };
  obj.self = obj;
  assertThrows(
    () => canonicalize(obj),
    TypeError,
    "Converting circular structure to JSON",
  );
});

Deno.test("canonicalize() throws on indirect circular reference", () => {
  // deno-lint-ignore no-explicit-any
  const a: any = { name: "a" };
  // deno-lint-ignore no-explicit-any
  const b: any = { name: "b" };
  a.ref = b;
  b.ref = a;
  assertThrows(
    () => canonicalize(a),
    TypeError,
    "Converting circular structure to JSON",
  );
});

Deno.test("canonicalize() throws on deeply nested circular reference", () => {
  // deno-lint-ignore no-explicit-any
  const root: any = {
    level1: {
      level2: {
        level3: {},
      },
    },
  };
  root.level1.level2.level3.backToRoot = root;
  assertThrows(
    () => canonicalize(root),
    TypeError,
    "Converting circular structure to JSON",
  );
});

Deno.test("canonicalize() throws on circular reference in array", () => {
  // deno-lint-ignore no-explicit-any
  const arr: any = [1, 2];
  arr.push(arr);
  assertThrows(
    () => canonicalize(arr),
    TypeError,
    "Converting circular structure to JSON",
  );
});

Deno.test("canonicalize() allows sibling references (non-circular)", () => {
  const shared = { x: 1 };
  const result = canonicalize({ a: shared, b: shared });
  assertEquals(result, '{"a":{"x":1},"b":{"x":1}}');
});

Deno.test("canonicalize() allows same object in array siblings", () => {
  const shared = { value: 42 };
  const result = canonicalize([shared, shared, shared]);
  assertEquals(result, '[{"value":42},{"value":42},{"value":42}]');
});

// Complex Nested Structures

Deno.test("canonicalize() handles deeply nested structures", () => {
  const data = {
    z: {
      y: {
        x: [1, { w: 2, v: 3 }],
      },
    },
    a: "first",
  };
  assertEquals(
    canonicalize(data),
    '{"a":"first","z":{"y":{"x":[1,{"v":3,"w":2}]}}}',
  );
});

Deno.test("canonicalize() handles very deep nesting", () => {
  type DeepObj = { value?: string; nested?: DeepObj };
  let deep: DeepObj = { value: "leaf" };
  for (let i = 0; i < 100; i++) {
    deep = { nested: deep };
  }
  const result = canonicalize(deep);
  assertEquals(result.startsWith('{"nested":'), true);
  assertEquals(result.endsWith('{"value":"leaf"}' + "}".repeat(100)), true);
});

// RFC 8785 Appendix E: Examples

Deno.test("canonicalize() produces RFC 8785 Appendix E example output", () => {
  const input = {
    time: "2019-01-28T07:45:10Z",
    big: "055",
    val: 3.5,
  };
  assertEquals(
    canonicalize(input),
    '{"big":"055","time":"2019-01-28T07:45:10Z","val":3.5}',
  );
});

Deno.test("canonicalize() handles complex string with escaping", () => {
  const input = "\u20ac$\u000F\u000aA''\u0042\"\\/";
  const result = canonicalize(input);
  assertEquals(result, '"€$\\u000f\\nA\'\'B\\"\\\\/"');
});

// RFC 8785 §3.2.4: UTF-8 Generation

Deno.test("canonicalizeToBytes() returns UTF-8 encoded bytes", () => {
  const result = canonicalizeToBytes({ a: 1 });
  assertEquals(result, new TextEncoder().encode('{"a":1}'));
});

Deno.test("canonicalizeToBytes() handles unicode correctly", () => {
  const result = canonicalizeToBytes({ emoji: "🦕" });
  assertEquals(result, new TextEncoder().encode('{"emoji":"🦕"}'));
});

Deno.test("canonicalizeToBytes() handles multi-byte characters", () => {
  const result = canonicalizeToBytes({ euro: "€", cjk: "日本語" });
  assertEquals(result, new TextEncoder().encode('{"cjk":"日本語","euro":"€"}'));
});

Deno.test("canonicalizeToBytes() throws on invalid input", () => {
  assertThrows(
    () => canonicalizeToBytes(NaN),
    TypeError,
    "Cannot canonicalize non-finite number",
  );
});

// Determinism

Deno.test("canonicalize() produces identical output regardless of key order", () => {
  const obj1 = { action: "transfer", amount: 100, to: "alice" };
  const obj2 = { to: "alice", action: "transfer", amount: 100 };
  const obj3 = { amount: 100, to: "alice", action: "transfer" };

  const result1 = canonicalize(obj1);
  const result2 = canonicalize(obj2);
  const result3 = canonicalize(obj3);

  assertEquals(result1, result2);
  assertEquals(result2, result3);
  assertEquals(result1, '{"action":"transfer","amount":100,"to":"alice"}');
});
