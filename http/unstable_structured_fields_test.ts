// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertThrows } from "@std/assert";
import {
  isBareItemType,
  isInnerList,
  isItem,
  parseDictionary,
  parseItem,
  parseList,
  serializeDictionary,
  serializeItem,
  serializeList,
  type SfBareItem,
  sfBinary,
  sfBoolean,
  sfDate,
  sfDecimal,
  type SfDictionary,
  sfDisplayString,
  type SfInnerList,
  sfInteger,
  type SfItem,
  type SfList,
  sfString,
  sfToken,
} from "./unstable_structured_fields.ts";

// =============================================================================
// Parsing Tests (edge cases NOT covered by conformance tests)
// Note: Basic parsing is covered by HTTPWG conformance tests below.
// These tests verify specific error messages and edge cases.
// =============================================================================

Deno.test({
  name: "parseList() rejects trailing garbage",
  fn() {
    assertThrows(
      () => parseList("1, 2 garbage"),
      SyntaxError,
      "expected ','",
    );
  },
});

Deno.test({
  name: "parseList() rejects unterminated inner list",
  fn() {
    assertThrows(
      () => parseList("(1 2"),
      SyntaxError,
      "expected SP or ')'",
    );
  },
});

Deno.test({
  name: "parseList() rejects invalid inner list separator",
  fn() {
    assertThrows(
      () => parseList("(1,2)"),
      SyntaxError,
      "expected SP or ')'",
    );
  },
});

Deno.test({
  name: "parseList() parses whitespace-only as empty list",
  fn() {
    const list = parseList("   ");
    assertEquals(list.length, 0);
  },
});

Deno.test({
  name: "parseList() rejects unterminated inner list at EOF",
  fn() {
    assertThrows(
      () => parseList("("),
      SyntaxError,
      "unterminated inner list",
    );
  },
});

Deno.test({
  name: "parseDictionary() rejects trailing garbage",
  fn() {
    assertThrows(
      () => parseDictionary("a=1 garbage"),
      SyntaxError,
      "expected ','",
    );
  },
});

Deno.test({
  name: "parseDictionary() parses whitespace-only as empty dictionary",
  fn() {
    const dict = parseDictionary("   ");
    assertEquals(dict.size, 0);
  },
});

Deno.test({
  name: "parseDictionary() handles key starting with *",
  fn() {
    const dict = parseDictionary("*key=1");
    assertEquals(dict.has("*key"), true);
    assertEquals((dict.get("*key") as SfItem).value, {
      type: "integer",
      value: 1,
    });
  },
});

Deno.test({
  name: "parseItem() parses token starting with *",
  fn() {
    const item = parseItem("*foo");
    assertEquals(item.value, { type: "token", value: "*foo" });
  },
});

Deno.test({
  name: "parseItem() rejects trailing garbage",
  fn() {
    assertThrows(
      () => parseItem("42 garbage"),
      SyntaxError,
      "unexpected character",
    );
  },
});

Deno.test({
  name: "parseItem() rejects whitespace-only input",
  fn() {
    assertThrows(
      () => parseItem("   "),
      SyntaxError,
      "unexpected character",
    );
  },
});

Deno.test({
  name: "parseItem() rejects decimal with no fractional digits",
  fn() {
    assertThrows(
      () => parseItem("1."),
      SyntaxError,
      "requires fractional digits",
    );
  },
});

Deno.test({
  name: "parseItem() rejects unterminated binary",
  fn() {
    assertThrows(
      () => parseItem(":aGVsbG8="),
      SyntaxError,
      "unterminated binary",
    );
  },
});

Deno.test({
  name: "parseItem() rejects invalid char in string after escape",
  fn() {
    // String with escape sequence followed by invalid character (NUL)
    // This tests the slow path in parseString (after processing escapes)
    assertThrows(
      () => parseItem('"test\\\\\x00"'),
      SyntaxError,
      "invalid character",
    );
  },
});

Deno.test({
  name: "parseItem() rejects invalid key start in parameters",
  fn() {
    assertThrows(
      () => parseItem("foo;1invalid=1"),
      SyntaxError,
      "invalid key start",
    );
  },
});

Deno.test({
  name: "parseItem() handles token with all valid chars",
  fn() {
    const item = parseItem("a0_-.*/+!#$%&'^`|~:");
    assertEquals(item.value.type, "token");
  },
});

Deno.test({
  name: "parseDictionary() handles key with all valid chars",
  fn() {
    const dict = parseDictionary("a0_-.*=1");
    assertEquals(dict.has("a0_-.*"), true);
  },
});

// =============================================================================
// Serialization Tests (RFC 9651 Section 4.1)
// Note: Serialization is NOT covered by conformance tests
// =============================================================================

Deno.test({
  name: "serializeList() serializes basic list",
  fn() {
    const list: SfList = [
      { value: sfInteger(1), parameters: new Map() },
      { value: sfInteger(42), parameters: new Map() },
    ];
    assertEquals(serializeList(list), "1, 42");
  },
});

Deno.test({
  name: "serializeList() serializes empty list",
  fn() {
    assertEquals(serializeList([]), "");
  },
});

Deno.test({
  name: "serializeList() serializes inner list",
  fn() {
    const innerList: SfInnerList = {
      items: [
        { value: sfInteger(1), parameters: new Map() },
        { value: sfInteger(2), parameters: new Map() },
      ],
      parameters: new Map(),
    };
    const list: SfList = [innerList];
    assertEquals(serializeList(list), "(1 2)");
  },
});

Deno.test({
  name: "serializeList() serializes inner list with parameters",
  fn() {
    const innerList: SfInnerList = {
      items: [
        { value: sfInteger(1), parameters: new Map() },
      ],
      parameters: new Map<string, SfBareItem>([
        ["param", sfToken("value")],
      ]),
    };
    assertEquals(serializeList([innerList]), "(1);param=value");
  },
});

Deno.test({
  name: "serializeDictionary() serializes basic dictionary",
  fn() {
    const dict: SfDictionary = new Map([
      ["a", { value: sfInteger(1), parameters: new Map() }],
      ["b", { value: sfInteger(2), parameters: new Map() }],
    ]);
    assertEquals(serializeDictionary(dict), "a=1, b=2");
  },
});

Deno.test({
  name: "serializeDictionary() omits =?1 for true boolean",
  fn() {
    const dict: SfDictionary = new Map([
      ["a", { value: sfBoolean(true), parameters: new Map() }],
    ]);
    assertEquals(serializeDictionary(dict), "a");
  },
});

Deno.test({
  name: "serializeDictionary() includes =?0 for false boolean",
  fn() {
    const dict: SfDictionary = new Map([
      ["a", { value: sfBoolean(false), parameters: new Map() }],
    ]);
    assertEquals(serializeDictionary(dict), "a=?0");
  },
});

Deno.test({
  name: "serializeDictionary() handles key starting with *",
  fn() {
    const dict: SfDictionary = new Map([
      ["*key", { value: sfInteger(1), parameters: new Map() }],
    ]);
    assertEquals(serializeDictionary(dict), "*key=1");
  },
});

Deno.test({
  name: "serializeDictionary() serializes inner list value",
  fn() {
    const innerList: SfInnerList = {
      items: [
        { value: sfInteger(1), parameters: new Map() },
        { value: sfInteger(2), parameters: new Map() },
      ],
      parameters: new Map(),
    };
    const dict: SfDictionary = new Map([
      ["a", innerList],
    ]);
    assertEquals(serializeDictionary(dict), "a=(1 2)");
  },
});

Deno.test({
  name: "serializeItem() covers all bare item types",
  fn() {
    assertEquals(
      serializeItem({ value: sfToken("foo"), parameters: new Map() }),
      "foo",
    );
    assertEquals(
      serializeItem({
        value: sfBinary(new Uint8Array([1, 2, 3])),
        parameters: new Map(),
      }),
      ":AQID:",
    );
    assertEquals(
      serializeItem({ value: sfBoolean(true), parameters: new Map() }),
      "?1",
    );
    assertEquals(
      serializeItem({ value: sfBoolean(false), parameters: new Map() }),
      "?0",
    );
    const d = new Date(1659578233000);
    assertEquals(
      serializeItem({ value: sfDate(d), parameters: new Map() }),
      "@1659578233",
    );
    assertEquals(
      serializeItem({ value: sfDisplayString("héllo"), parameters: new Map() }),
      '%"h%c3%a9llo"',
    );
  },
});

Deno.test({
  name: "serializeItem() escapes quotes and backslash in string",
  fn() {
    assertEquals(
      serializeItem({
        value: sfString('hello "world"'),
        parameters: new Map(),
      }),
      '"hello \\"world\\""',
    );
    assertEquals(
      serializeItem({ value: sfString("hello\\world"), parameters: new Map() }),
      '"hello\\\\world"',
    );
  },
});

Deno.test({
  name: "serializeItem() serializes item with parameters",
  fn() {
    const params = new Map<string, SfBareItem>([
      ["a", sfInteger(1)],
      ["b", sfBoolean(true)],
    ]);
    assertEquals(
      serializeItem({ value: sfToken("foo"), parameters: params }),
      "foo;a=1;b",
    );
  },
});

Deno.test({
  name: "serializeItem() handles boundary integers",
  fn() {
    assertEquals(
      serializeItem({
        value: sfInteger(-999_999_999_999_999),
        parameters: new Map(),
      }),
      "-999999999999999",
    );
    assertEquals(
      serializeItem({
        value: sfInteger(999_999_999_999_999),
        parameters: new Map(),
      }),
      "999999999999999",
    );
  },
});

Deno.test({
  name: "serializeItem() handles decimal edge cases",
  fn() {
    assertEquals(
      serializeItem({ value: sfDecimal(1.0), parameters: new Map() }),
      "1.0",
    );
    assertEquals(
      serializeItem({ value: sfDecimal(-3.14), parameters: new Map() }),
      "-3.14",
    );
  },
});

Deno.test({
  name: "serializeItem() handles token starting with *",
  fn() {
    assertEquals(
      serializeItem({ value: sfToken("*foo"), parameters: new Map() }),
      "*foo",
    );
  },
});

Deno.test({
  name: 'serializeItem() encodes % and " in display string',
  fn() {
    assertEquals(
      serializeItem({
        value: sfDisplayString('hello % and "'),
        parameters: new Map(),
      }),
      '%"hello %25 and %22"',
    );
  },
});

// =============================================================================
// Serialization Error Tests
// =============================================================================

Deno.test({
  name: "serializeItem() rejects out-of-range integer",
  fn() {
    assertThrows(
      () => serializeItem({ value: sfInteger(1e16), parameters: new Map() }),
      TypeError,
      "out of range",
    );
    assertThrows(
      () => serializeItem({ value: sfInteger(-1e16), parameters: new Map() }),
      TypeError,
      "out of range",
    );
  },
});

Deno.test({
  name: "serializeItem() rejects non-integer value for integer type",
  fn() {
    assertThrows(
      () => serializeItem({ value: sfInteger(3.14), parameters: new Map() }),
      TypeError,
      "must be a whole number",
    );
  },
});

Deno.test({
  name: "serializeItem() rejects non-finite decimal",
  fn() {
    assertThrows(
      () =>
        serializeItem({ value: sfDecimal(Infinity), parameters: new Map() }),
      TypeError,
      "must be finite",
    );
    assertThrows(
      () => serializeItem({ value: sfDecimal(NaN), parameters: new Map() }),
      TypeError,
      "must be finite",
    );
  },
});

Deno.test({
  name: "serializeItem() rejects decimal with integer part too large",
  fn() {
    assertThrows(
      () =>
        serializeItem({
          value: sfDecimal(1_000_000_000_000.1),
          parameters: new Map(),
        }),
      TypeError,
      "integer part too large",
    );
    assertThrows(
      () =>
        serializeItem({
          value: sfDecimal(-1_000_000_000_000.1),
          parameters: new Map(),
        }),
      TypeError,
      "integer part too large",
    );
  },
});

Deno.test({
  name: "serializeItem() rejects invalid date",
  fn() {
    assertThrows(
      () =>
        serializeItem({
          value: sfDate(new Date("invalid")),
          parameters: new Map(),
        }),
      TypeError,
      "Invalid date",
    );
  },
});

Deno.test({
  name: "serializeItem() rejects non-printable ASCII in string",
  fn() {
    assertThrows(
      () => serializeItem({ value: sfString("\x00"), parameters: new Map() }),
      TypeError,
      "Invalid character",
    );
  },
});

Deno.test({
  name: "serializeItem() rejects non-ASCII in string",
  fn() {
    assertThrows(
      () => serializeItem({ value: sfString("héllo"), parameters: new Map() }),
      TypeError,
      "Invalid character",
    );
  },
});

Deno.test({
  name: "serializeItem() rejects empty token",
  fn() {
    assertThrows(
      () => serializeItem({ value: sfToken(""), parameters: new Map() }),
      TypeError,
      "cannot be empty",
    );
  },
});

Deno.test({
  name: "serializeItem() rejects token with invalid start character",
  fn() {
    assertThrows(
      () => serializeItem({ value: sfToken("1foo"), parameters: new Map() }),
      TypeError,
      "must start with ALPHA",
    );
  },
});

Deno.test({
  name: "serializeItem() rejects token with invalid character",
  fn() {
    assertThrows(
      () => serializeItem({ value: sfToken("foo bar"), parameters: new Map() }),
      TypeError,
      "Invalid character in token",
    );
  },
});

Deno.test({
  name: "serializeDictionary() rejects invalid key",
  fn() {
    const dict: SfDictionary = new Map([
      ["INVALID", { value: sfInteger(1), parameters: new Map() }],
    ]);
    assertThrows(
      () => serializeDictionary(dict),
      TypeError,
      "must start with lowercase",
    );
  },
});

Deno.test({
  name: "serializeDictionary() rejects empty key",
  fn() {
    const dict: SfDictionary = new Map([
      ["", { value: sfInteger(1), parameters: new Map() }],
    ]);
    assertThrows(
      () => serializeDictionary(dict),
      TypeError,
      "cannot be empty",
    );
  },
});

Deno.test({
  name: "serializeDictionary() rejects key with invalid character",
  fn() {
    const dict: SfDictionary = new Map([
      ["a!b", { value: sfInteger(1), parameters: new Map() }],
    ]);
    assertThrows(
      () => serializeDictionary(dict),
      TypeError,
      "Invalid character in key",
    );
  },
});

Deno.test({
  name: "serializeItem() rejects invalid parameter key",
  fn() {
    const params = new Map<string, SfBareItem>([
      ["INVALID", sfInteger(1)],
    ]);
    assertThrows(
      () => serializeItem({ value: sfToken("foo"), parameters: params }),
      TypeError,
      "must start with lowercase",
    );
  },
});

// =============================================================================
// Round-trip Tests
// =============================================================================

Deno.test({
  name: "round-trip: list with inner list",
  fn() {
    const input = "1, 42, (a b)";
    const parsed = parseList(input);
    const serialized = serializeList(parsed);
    const reparsed = parseList(serialized);
    assertEquals(parsed.length, reparsed.length);
  },
});

Deno.test({
  name: "round-trip: dictionary with mixed values",
  fn() {
    const input = 'a=1, b="hello", c';
    const parsed = parseDictionary(input);
    const serialized = serializeDictionary(parsed);
    const reparsed = parseDictionary(serialized);
    assertEquals(parsed.size, reparsed.size);
  },
});

Deno.test({
  name: "round-trip: item with parameters",
  fn() {
    const input = "foo;a=1;b";
    const parsed = parseItem(input);
    const serialized = serializeItem(parsed);
    const reparsed = parseItem(serialized);
    assertEquals(parsed.value, reparsed.value);
    assertEquals(parsed.parameters.size, reparsed.parameters.size);
  },
});

// =============================================================================
// Convenience Builder Tests
// =============================================================================

Deno.test({
  name: "sf* factory functions create correct bare items",
  fn() {
    assertEquals(sfInteger(42), { type: "integer", value: 42 });
    assertEquals(sfDecimal(3.14), { type: "decimal", value: 3.14 });
    assertEquals(sfString("hello"), { type: "string", value: "hello" });
    assertEquals(sfToken("foo"), { type: "token", value: "foo" });
    assertEquals(sfBinary(new Uint8Array([1, 2, 3])).type, "binary");
    assertEquals(sfBoolean(true), { type: "boolean", value: true });
    assertEquals(sfBoolean(false), { type: "boolean", value: false });
    const d = new Date();
    assertEquals(sfDate(d), { type: "date", value: d });
    assertEquals(sfDisplayString("héllo"), {
      type: "displaystring",
      value: "héllo",
    });
  },
});

// =============================================================================
// Type Guard Tests
// =============================================================================

Deno.test({
  name: "isItem() distinguishes items from inner lists",
  fn() {
    const list = parseList("1, (2 3)");
    assertEquals(isItem(list[0]!), true);
    assertEquals(isItem(list[1]!), false);
  },
});

Deno.test({
  name: "isInnerList() distinguishes inner lists from items",
  fn() {
    const list = parseList("1, (2 3)");
    assertEquals(isInnerList(list[0]!), false);
    assertEquals(isInnerList(list[1]!), true);
  },
});

Deno.test({
  name: "isBareItemType() narrows bare item type",
  fn() {
    const item = parseItem("42");
    assertEquals(isBareItemType(item.value, "integer"), true);
    assertEquals(isBareItemType(item.value, "string"), false);

    if (isBareItemType(item.value, "integer")) {
      // TypeScript should know this is a number
      assertEquals(item.value.value, 42);
    }
  },
});

Deno.test({
  name: "type guards work with dictionary values",
  fn() {
    const dict = parseDictionary("a=1, b=(1 2)");
    const a = dict.get("a")!;
    const b = dict.get("b")!;

    assertEquals(isItem(a), true);
    assertEquals(isInnerList(a), false);
    assertEquals(isItem(b), false);
    assertEquals(isInnerList(b), true);
  },
});

// =============================================================================
// HTTPWG Official Conformance Tests (https://github.com/httpwg/structured-field-tests)
// =============================================================================

// Base32 alphabet for decoding test vectors
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function decodeBase32(input: string): Uint8Array {
  // Remove padding
  input = input.replace(/=+$/, "").toUpperCase();
  if (input.length === 0) return new Uint8Array(0);

  const output: number[] = [];
  let bits = 0;
  let value = 0;

  for (const char of input) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) throw new Error(`Invalid base32 character: ${char}`);
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      output.push((value >> bits) & 0xff);
    }
  }
  return new Uint8Array(output);
}

// Convert test suite expected value to our internal format
// deno-lint-ignore no-explicit-any
function convertExpectedBareItem(expected: any): SfBareItem {
  if (expected === null || expected === undefined) {
    throw new Error("Unexpected null/undefined bare item");
  }
  if (typeof expected === "boolean") {
    return sfBoolean(expected);
  }
  if (typeof expected === "number") {
    if (Number.isInteger(expected)) {
      return sfInteger(expected);
    }
    return sfDecimal(expected);
  }
  if (typeof expected === "string") {
    return sfString(expected);
  }
  if (typeof expected === "object" && "__type" in expected) {
    switch (expected.__type) {
      case "token":
        return sfToken(expected.value);
      case "binary":
        return sfBinary(decodeBase32(expected.value));
      case "date":
        return sfDate(new Date(expected.value * 1000));
      case "displaystring":
        return sfDisplayString(expected.value);
      default:
        throw new Error(`Unknown __type: ${expected.__type}`);
    }
  }
  throw new Error(`Cannot convert expected value: ${JSON.stringify(expected)}`);
}

// Convert test suite expected params array to Map
// deno-lint-ignore no-explicit-any
function convertExpectedParams(params: any[]): Map<string, SfBareItem> {
  const map = new Map<string, SfBareItem>();
  for (const [key, value] of params) {
    map.set(key, convertExpectedBareItem(value));
  }
  return map;
}

// Convert test suite expected item [bareItem, params] to SfItem
// deno-lint-ignore no-explicit-any
function convertExpectedItem(expected: any[]): SfItem {
  const [bareItem, params] = expected;
  return {
    value: convertExpectedBareItem(bareItem),
    parameters: convertExpectedParams(params),
  };
}

// Convert test suite expected inner list [[items...], params] to SfInnerList
// deno-lint-ignore no-explicit-any
function convertExpectedInnerList(expected: any[]): SfInnerList {
  const [items, params] = expected;
  return {
    items: items.map(convertExpectedItem),
    parameters: convertExpectedParams(params),
  };
}

// Check if expected value represents an inner list
// deno-lint-ignore no-explicit-any
function isExpectedInnerList(expected: any[]): boolean {
  // Inner list: [[item1, item2, ...], params]
  // Item: [bareItem, params]
  // The first element of an inner list is an array of items (arrays)
  // The first element of an item is a bare item (not an array, unless it's broken)
  if (!Array.isArray(expected) || expected.length !== 2) return false;
  const [first] = expected;
  if (!Array.isArray(first)) return false;
  // If first element is empty array, it's an empty inner list
  if (first.length === 0) return true;
  // If first element is an array of arrays, it's an inner list
  return Array.isArray(first[0]);
}

// Convert test suite expected list member
// deno-lint-ignore no-explicit-any
function convertExpectedListMember(expected: any[]): SfItem | SfInnerList {
  if (isExpectedInnerList(expected)) {
    return convertExpectedInnerList(expected);
  }
  return convertExpectedItem(expected);
}

// Compare bare items for equality
function bareItemsEqual(a: SfBareItem, b: SfBareItem): boolean {
  // Handle integer/decimal comparison - JSON loses distinction between 1 and 1.0
  if (
    (a.type === "integer" || a.type === "decimal") &&
    (b.type === "integer" || b.type === "decimal")
  ) {
    return (a.value as number) === (b.value as number);
  }
  if (a.type !== b.type) return false;
  if (a.type === "binary" && b.type === "binary") {
    const aVal = a.value as Uint8Array;
    const bVal = b.value as Uint8Array;
    if (aVal.length !== bVal.length) return false;
    return aVal.every((v, i) => v === bVal[i]);
  }
  if (a.type === "date" && b.type === "date") {
    return (a.value as Date).getTime() === (b.value as Date).getTime();
  }
  return a.value === b.value;
}

// Compare parameters for equality
function paramsEqual(
  a: ReadonlyMap<string, SfBareItem>,
  b: ReadonlyMap<string, SfBareItem>,
): boolean {
  if (a.size !== b.size) return false;
  for (const [key, val] of a) {
    const bVal = b.get(key);
    if (!bVal || !bareItemsEqual(val, bVal)) return false;
  }
  return true;
}

// Compare items for equality
function itemsEqual(a: SfItem, b: SfItem): boolean {
  return bareItemsEqual(a.value, b.value) &&
    paramsEqual(a.parameters, b.parameters);
}

// Compare inner lists for equality
function innerListsEqual(a: SfInnerList, b: SfInnerList): boolean {
  if (a.items.length !== b.items.length) return false;
  for (let i = 0; i < a.items.length; i++) {
    if (!itemsEqual(a.items[i]!, b.items[i]!)) return false;
  }
  return paramsEqual(a.parameters, b.parameters);
}

// Compare list members for equality
function listMembersEqual(
  a: SfItem | SfInnerList,
  b: SfItem | SfInnerList,
): boolean {
  const aIsInner = "items" in a;
  const bIsInner = "items" in b;
  if (aIsInner !== bIsInner) return false;
  if (aIsInner && bIsInner) {
    return innerListsEqual(a as SfInnerList, b as SfInnerList);
  }
  return itemsEqual(a as SfItem, b as SfItem);
}

// Interface for test case from JSON files
interface ConformanceTestCase {
  name: string;
  raw: string[];
  // deno-lint-ignore camelcase
  header_type?: "item" | "list" | "dictionary";
  // deno-lint-ignore no-explicit-any
  expected?: any;
  canonical?: string[];
  // deno-lint-ignore camelcase
  must_fail?: boolean;
  // deno-lint-ignore camelcase
  can_fail?: boolean;
}

// Load and run tests from a JSON file
async function runConformanceTests(
  t: Deno.TestContext,
  filename: string,
): Promise<void> {
  const testData = await import(`./testdata/structured_fields/${filename}`, {
    with: { type: "json" },
  });
  const tests: ConformanceTestCase[] = testData.default;

  for (const test of tests) {
    // Skip tests marked can_fail (implementation-dependent)
    if (test.can_fail) continue;

    const rawInput = test.raw.join(", ");
    const headerType = test.header_type ?? "item";

    await t.step(test.name, () => {
      if (test.must_fail) {
        // Test should fail parsing
        assertThrows(
          () => {
            switch (headerType) {
              case "item":
                parseItem(rawInput);
                break;
              case "list":
                parseList(rawInput);
                break;
              case "dictionary":
                parseDictionary(rawInput);
                break;
            }
          },
          Error,
        );
      } else {
        // Test should succeed
        switch (headerType) {
          case "item": {
            const parsed = parseItem(rawInput);
            const expected = convertExpectedItem(test.expected);
            assertEquals(
              itemsEqual(parsed, expected),
              true,
              `Mismatch for "${test.name}": got ${
                JSON.stringify(parsed)
              }, expected ${JSON.stringify(expected)}`,
            );
            // Test canonical serialization if provided
            if (test.canonical) {
              const serialized = serializeItem(parsed);
              assertEquals(serialized, test.canonical[0]);
            }
            break;
          }
          case "list": {
            const parsed = parseList(rawInput);
            const expected: SfList = test.expected.map(
              convertExpectedListMember,
            );
            assertEquals(parsed.length, expected.length);
            for (let i = 0; i < parsed.length; i++) {
              assertEquals(
                listMembersEqual(parsed[i]!, expected[i]!),
                true,
                `List member ${i} mismatch for "${test.name}"`,
              );
            }
            // Test canonical serialization if provided
            if (test.canonical) {
              const serialized = serializeList(parsed);
              assertEquals(
                serialized,
                test.canonical[0] ?? test.canonical.join(", "),
              );
            }
            break;
          }
          case "dictionary": {
            const parsed = parseDictionary(rawInput);
            // Convert expected dictionary format [[key, value], ...]
            const expectedEntries: Array<[string, SfItem | SfInnerList]> =
              // deno-lint-ignore no-explicit-any
              (test.expected as any[]).map(
                ([key, value]: [string, unknown]) => [
                  key,
                  convertExpectedListMember(value as unknown[]),
                ],
              );
            assertEquals(parsed.size, expectedEntries.length);
            for (const [key, expectedValue] of expectedEntries) {
              const parsedValue = parsed.get(key);
              assertEquals(
                parsedValue !== undefined,
                true,
                `Missing key "${key}" in parsed dictionary`,
              );
              assertEquals(
                listMembersEqual(parsedValue!, expectedValue),
                true,
                `Dictionary value mismatch for key "${key}" in "${test.name}"`,
              );
            }
            // Test canonical serialization if provided
            if (test.canonical) {
              const serialized = serializeDictionary(parsed);
              assertEquals(
                serialized,
                test.canonical[0] ?? test.canonical.join(", "),
              );
            }
            break;
          }
        }
      }
    });
  }
}

// Run all conformance test files
Deno.test({
  name: "HTTPWG Conformance Tests: binary.json",
  async fn(t) {
    await runConformanceTests(t, "binary.json");
  },
});

Deno.test({
  name: "HTTPWG Conformance Tests: boolean.json",
  async fn(t) {
    await runConformanceTests(t, "boolean.json");
  },
});

Deno.test({
  name: "HTTPWG Conformance Tests: date.json",
  async fn(t) {
    await runConformanceTests(t, "date.json");
  },
});

Deno.test({
  name: "HTTPWG Conformance Tests: dictionary.json",
  async fn(t) {
    await runConformanceTests(t, "dictionary.json");
  },
});

Deno.test({
  name: "HTTPWG Conformance Tests: display-string.json",
  async fn(t) {
    await runConformanceTests(t, "display-string.json");
  },
});

Deno.test({
  name: "HTTPWG Conformance Tests: examples.json",
  async fn(t) {
    await runConformanceTests(t, "examples.json");
  },
});

Deno.test({
  name: "HTTPWG Conformance Tests: item.json",
  async fn(t) {
    await runConformanceTests(t, "item.json");
  },
});

Deno.test({
  name: "HTTPWG Conformance Tests: list.json",
  async fn(t) {
    await runConformanceTests(t, "list.json");
  },
});

Deno.test({
  name: "HTTPWG Conformance Tests: number.json",
  async fn(t) {
    await runConformanceTests(t, "number.json");
  },
});

Deno.test({
  name: "HTTPWG Conformance Tests: param-dict.json",
  async fn(t) {
    await runConformanceTests(t, "param-dict.json");
  },
});

Deno.test({
  name: "HTTPWG Conformance Tests: param-list.json",
  async fn(t) {
    await runConformanceTests(t, "param-list.json");
  },
});

Deno.test({
  name: "HTTPWG Conformance Tests: param-listlist.json",
  async fn(t) {
    await runConformanceTests(t, "param-listlist.json");
  },
});

Deno.test({
  name: "HTTPWG Conformance Tests: string.json",
  async fn(t) {
    await runConformanceTests(t, "string.json");
  },
});

Deno.test({
  name: "HTTPWG Conformance Tests: token.json",
  async fn(t) {
    await runConformanceTests(t, "token.json");
  },
});
