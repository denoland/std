// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Utilities for parsing and serializing
 * {@link https://www.rfc-editor.org/rfc/rfc9651 | RFC 9651} Structured Field Values for HTTP.
 *
 * Structured Fields provide a standardized way to define HTTP header and trailer
 * field values using common data types (Lists, Dictionaries, Items) with strict
 * parsing and serialization rules.
 *
 * @example Parsing a Dictionary (e.g., UCP-Agent header)
 * ```ts
 * import { isItem, parseDictionary } from "@std/http/unstable-structured-fields";
 * import { assertEquals } from "@std/assert";
 *
 * const header = 'profile="https://example.com/profile.json"';
 * const dict = parseDictionary(header);
 * const profile = dict.get("profile");
 *
 * if (profile && isItem(profile)) {
 *   assertEquals(profile.value, {
 *     type: "string",
 *     value: "https://example.com/profile.json",
 *   });
 * }
 * ```
 *
 * @example Serializing a Dictionary
 * ```ts
 * import { item, serializeDictionary, string } from "@std/http/unstable-structured-fields";
 * import { assertEquals } from "@std/assert";
 *
 * const dict = new Map([
 *   ["profile", item(string("https://example.com/profile.json"))],
 * ]);
 *
 * assertEquals(
 *   serializeDictionary(dict),
 *   'profile="https://example.com/profile.json"'
 * );
 * ```
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @module
 */

import { decodeBase64, encodeBase64 } from "@std/encoding/base64";

const UTF8_DECODER = new TextDecoder("utf-8", { fatal: true });

// =============================================================================
// Type Definitions (RFC 9651 Section 3)
// =============================================================================

/**
 * A Bare Item value in a Structured Field.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc9651#section-3.3}
 */
export type BareItem =
  | { type: "integer"; value: number }
  | { type: "decimal"; value: number }
  | { type: "string"; value: string }
  | { type: "token"; value: string }
  | { type: "binary"; value: Uint8Array }
  | { type: "boolean"; value: boolean }
  | { type: "date"; value: Date }
  | { type: "displaystring"; value: string };

/**
 * Parameters attached to an Item or Inner List.
 *
 * Returned parameters are immutable. When building parameters for serialization,
 * you can pass a mutable `Map` as it is assignable to `ReadonlyMap`.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc9651#section-3.1.2}
 */
export type Parameters = ReadonlyMap<string, BareItem>;

/**
 * An Item in a Structured Field, consisting of a Bare Item and Parameters.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc9651#section-3.3}
 */
export interface Item {
  /** The bare item value. */
  value: BareItem;
  /** Parameters associated with this item. */
  parameters: Parameters;
}

/**
 * An Inner List in a Structured Field.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc9651#section-3.1.1}
 */
export interface InnerList {
  /** The items in the inner list. */
  items: Item[];
  /** Parameters associated with the inner list. */
  parameters: Parameters;
}

/**
 * A List Structured Field value.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc9651#section-3.1}
 */
export type List = Array<Item | InnerList>;

/**
 * A Dictionary Structured Field value.
 *
 * Returned dictionaries are immutable. When building dictionaries for serialization,
 * you can pass a mutable `Map` as it is assignable to `ReadonlyMap`.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc9651#section-3.2}
 */
export type Dictionary = ReadonlyMap<string, Item | InnerList>;

// =============================================================================
// Convenience Builders
// =============================================================================

/**
 * Creates an integer Bare Item.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param value The integer value (-999999999999999 to 999999999999999).
 * @returns A Bare Item of type integer.
 *
 * @example Usage
 * ```ts
 * import { integer } from "@std/http/unstable-structured-fields";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(integer(42), { type: "integer", value: 42 });
 * ```
 */
export function integer(value: number): Extract<BareItem, { type: "integer" }> {
  return { type: "integer", value };
}

/**
 * Creates a decimal Bare Item.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param value The decimal value.
 * @returns A Bare Item of type decimal.
 *
 * @example Usage
 * ```ts
 * import { decimal } from "@std/http/unstable-structured-fields";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(decimal(3.14), { type: "decimal", value: 3.14 });
 * ```
 */
export function decimal(value: number): Extract<BareItem, { type: "decimal" }> {
  return { type: "decimal", value };
}

/**
 * Creates a string Bare Item.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param value The string value (ASCII printable characters only).
 * @returns A Bare Item of type string.
 *
 * @example Usage
 * ```ts
 * import { string } from "@std/http/unstable-structured-fields";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(string("hello"), { type: "string", value: "hello" });
 * ```
 */
export function string(value: string): Extract<BareItem, { type: "string" }> {
  return { type: "string", value };
}

/**
 * Creates a token Bare Item.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param value The token value.
 * @returns A Bare Item of type token.
 *
 * @example Usage
 * ```ts
 * import { token } from "@std/http/unstable-structured-fields";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(token("foo"), { type: "token", value: "foo" });
 * ```
 */
export function token(value: string): Extract<BareItem, { type: "token" }> {
  return { type: "token", value };
}

/**
 * Creates a binary Bare Item.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param value The binary value as a Uint8Array.
 * @returns A Bare Item of type binary.
 *
 * @example Usage
 * ```ts
 * import { binary } from "@std/http/unstable-structured-fields";
 * import { assertEquals } from "@std/assert";
 *
 * const result = binary(new Uint8Array([1, 2, 3]));
 * assertEquals(result.type, "binary");
 * ```
 */
export function binary(
  value: Uint8Array,
): Extract<BareItem, { type: "binary" }> {
  return { type: "binary", value };
}

/**
 * Creates a boolean Bare Item.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param value The boolean value.
 * @returns A Bare Item of type boolean.
 *
 * @example Usage
 * ```ts
 * import { boolean } from "@std/http/unstable-structured-fields";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(boolean(true), { type: "boolean", value: true });
 * ```
 */
export function boolean(
  value: boolean,
): Extract<BareItem, { type: "boolean" }> {
  return { type: "boolean", value };
}

/**
 * Creates a date Bare Item.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param value The date value.
 * @returns A Bare Item of type date.
 *
 * @example Usage
 * ```ts
 * import { date } from "@std/http/unstable-structured-fields";
 * import { assertEquals } from "@std/assert";
 *
 * const d = new Date("2022-08-04T00:00:00Z");
 * assertEquals(date(d), { type: "date", value: d });
 * ```
 */
export function date(value: Date): Extract<BareItem, { type: "date" }> {
  return { type: "date", value };
}

/**
 * Creates a display string Bare Item.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param value The display string value (can contain Unicode).
 * @returns A Bare Item of type displaystring.
 *
 * @example Usage
 * ```ts
 * import { displayString } from "@std/http/unstable-structured-fields";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(displayString("héllo"), { type: "displaystring", value: "héllo" });
 * ```
 */
export function displayString(
  value: string,
): Extract<BareItem, { type: "displaystring" }> {
  return { type: "displaystring", value };
}

/**
 * Creates an Item from a Bare Item and optional Parameters.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param value The Bare Item value.
 * @param parameters Optional parameters as a `Map` or iterable of key-value pairs.
 * @returns An Item with the given value and parameters.
 *
 * @example Usage
 * ```ts
 * import { item, integer, token } from "@std/http/unstable-structured-fields";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(item(integer(42)), {
 *   value: { type: "integer", value: 42 },
 *   parameters: new Map(),
 * });
 *
 * assertEquals(item(integer(42), [["q", token("fast")]]), {
 *   value: { type: "integer", value: 42 },
 *   parameters: new Map([["q", { type: "token", value: "fast" }]]),
 * });
 * ```
 */
export function item(
  value: BareItem,
  parameters?: Iterable<[string, BareItem]>,
): Item {
  return { value, parameters: new Map(parameters) };
}

/**
 * Creates an Inner List from Items and optional Parameters.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param items The items in the inner list.
 * @param parameters Optional parameters as a `Map` or iterable of key-value pairs.
 * @returns An InnerList with the given items and parameters.
 *
 * @example Usage
 * ```ts
 * import { innerList, item, integer } from "@std/http/unstable-structured-fields";
 * import { assertEquals } from "@std/assert";
 *
 * const list = innerList([item(integer(1)), item(integer(2))]);
 *
 * assertEquals(list.items.length, 2);
 * assertEquals(list.parameters.size, 0);
 * ```
 */
export function innerList(
  items: Item[],
  parameters?: Iterable<[string, BareItem]>,
): InnerList {
  return { items, parameters: new Map(parameters) };
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Checks if a list member is an Item (not an Inner List).
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param member The list member to check.
 * @returns `true` if the member is an Item, `false` if it's an Inner List.
 *
 * @example Usage
 * ```ts
 * import { parseList, isItem } from "@std/http/unstable-structured-fields";
 * import { assert } from "@std/assert";
 *
 * const list = parseList("1, (2 3)");
 * assert(isItem(list[0]!));   // true - integer item
 * assert(!isItem(list[1]!));  // false - inner list
 * ```
 */
export function isItem(member: Item | InnerList): member is Item {
  return !("items" in member);
}

/**
 * Checks if a list member is an Inner List.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param member The list member to check.
 * @returns `true` if the member is an Inner List, `false` if it's an Item.
 *
 * @example Usage
 * ```ts
 * import { parseList, isInnerList } from "@std/http/unstable-structured-fields";
 * import { assert } from "@std/assert";
 *
 * const list = parseList("1, (2 3)");
 * assert(!isInnerList(list[0]!)); // false - integer item
 * assert(isInnerList(list[1]!));  // true - inner list
 * ```
 */
export function isInnerList(
  member: Item | InnerList,
): member is InnerList {
  return "items" in member;
}

// =============================================================================
// Parsing (RFC 9651 Section 4.2)
// =============================================================================

/** Parser state holding input string and current position. */
interface ParserState {
  input: string;
  pos: number;
}

// Character code constants for ASCII ranges
const CHAR_CODE_0 = 48; // '0'
const CHAR_CODE_9 = 57; // '9'
const CHAR_CODE_UPPER_A = 65; // 'A'
const CHAR_CODE_UPPER_Z = 90; // 'Z'
const CHAR_CODE_LOWER_A = 97; // 'a'
const CHAR_CODE_LOWER_Z = 122; // 'z'

// RFC 9651 numeric limits
const MAX_INTEGER_DIGITS = 15;
const MAX_INTEGER = 999_999_999_999_999;
const MAX_DECIMAL_INTEGER_DIGITS = 12;
const MAX_DECIMAL_FRACTIONAL_DIGITS = 3;
const MAX_DECIMAL_INTEGER_PART = 999_999_999_999;

/** Check if character is alphabetic (A-Z or a-z) */
function isAlpha(c: string): boolean {
  const code = c.charCodeAt(0);
  return (code >= CHAR_CODE_UPPER_A && code <= CHAR_CODE_UPPER_Z) ||
    (code >= CHAR_CODE_LOWER_A && code <= CHAR_CODE_LOWER_Z);
}

/** Check if character is a digit (0-9) */
function isDigit(c: string): boolean {
  const code = c.charCodeAt(0);
  return code >= CHAR_CODE_0 && code <= CHAR_CODE_9;
}

/** Check if character is lowercase alphabetic (a-z) */
function isLcalpha(c: string): boolean {
  const code = c.charCodeAt(0);
  return code >= CHAR_CODE_LOWER_A && code <= CHAR_CODE_LOWER_Z;
}

/** Check if character is valid at the start of a key (lcalpha or "*") */
function isKeyStart(c: string): boolean {
  return isLcalpha(c) || c === "*";
}

/** Check if character is valid within a key (lcalpha / DIGIT / "_" / "-" / "." / "*") */
function isKeyChar(c: string): boolean {
  return isLcalpha(c) || isDigit(c) || c === "_" || c === "-" || c === "." ||
    c === "*";
}

// Pre-computed lookup table for tchar (RFC 9110 token characters)
// tchar = "!" / "#" / "$" / "%" / "&" / "'" / "*" / "+" / "-" / "." /
//         "^" / "_" / "`" / "|" / "~" / DIGIT / ALPHA
const TCHAR_LOOKUP: boolean[] = (() => {
  const table: boolean[] = new Array(128).fill(false);
  const tchars = "!#$%&'*+-.^_`|~0123456789" +
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  for (const c of tchars) {
    table[c.charCodeAt(0)] = true;
  }
  return table;
})();

// Pre-computed lookup table for base64 characters (A-Z, a-z, 0-9, +, /, =)
const BASE64_LOOKUP: boolean[] = (() => {
  const table: boolean[] = new Array(128).fill(false);
  for (let i = CHAR_CODE_UPPER_A; i <= CHAR_CODE_UPPER_Z; i++) table[i] = true;
  for (let i = CHAR_CODE_LOWER_A; i <= CHAR_CODE_LOWER_Z; i++) table[i] = true;
  for (let i = CHAR_CODE_0; i <= CHAR_CODE_9; i++) table[i] = true;
  table[43] = true; // +
  table[47] = true; // /
  table[61] = true; // =
  return table;
})();

/** Check if character is a valid base64 character */
function isBase64Char(c: string): boolean {
  const code = c.charCodeAt(0);
  return code < 128 && BASE64_LOOKUP[code]!;
}

/** Check if character is a lowercase hex digit (0-9, a-f) */
function isLcHexDigit(c: string): boolean {
  const code = c.charCodeAt(0);
  return (code >= CHAR_CODE_0 && code <= CHAR_CODE_9) ||
    (code >= CHAR_CODE_LOWER_A && code <= 102); // 'f' = 102
}

/** RFC 9110 tchar: token characters */
function isTchar(c: string): boolean {
  const code = c.charCodeAt(0);
  return code < 128 && TCHAR_LOOKUP[code]!;
}

/** Check if at end of input */
function isEof(state: ParserState): boolean {
  return state.pos >= state.input.length;
}

/** Peek current character */
function peek(state: ParserState): string {
  return state.input[state.pos] ?? "";
}

/** Consume current character and advance */
function consume(state: ParserState): string {
  return state.input[state.pos++] ?? "";
}

/** Skip optional whitespace (SP or HTAB) */
function skipOWS(state: ParserState): void {
  while (!isEof(state) && (peek(state) === " " || peek(state) === "\t")) {
    state.pos++;
  }
}

/** Skip required whitespace (at least one SP) */
function skipSP(state: ParserState): void {
  while (!isEof(state) && peek(state) === " ") {
    state.pos++;
  }
}

/**
 * Parses a List Structured Field value.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param input The string to parse.
 * @returns The parsed List.
 * @throws {SyntaxError} If the input is invalid.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc9651#section-4.2.1}
 *
 * @example Usage
 * ```ts
 * import { parseList } from "@std/http/unstable-structured-fields";
 * import { assertEquals } from "@std/assert";
 *
 * const list = parseList("1, 42");
 * assertEquals(list.length, 2);
 * ```
 */
export function parseList(input: string): List {
  const state: ParserState = { input, pos: 0 };
  skipSP(state);
  const list = parseListInternal(state);
  skipSP(state);
  if (!isEof(state)) {
    throw new SyntaxError(
      `Invalid structured field: unexpected character at position ${state.pos}`,
    );
  }
  return list;
}

function parseListInternal(state: ParserState): List {
  const members: List = [];

  while (!isEof(state)) {
    const member = parseItemOrInnerList(state);
    members.push(member);
    skipOWS(state);
    if (isEof(state)) {
      return members;
    }
    if (peek(state) !== ",") {
      throw new SyntaxError(
        `Invalid structured field: expected ',' at position ${state.pos}`,
      );
    }
    consume(state); // consume ','
    skipOWS(state);
    if (isEof(state)) {
      throw new SyntaxError(
        "Invalid structured field: trailing comma in list",
      );
    }
  }

  return members;
}

/**
 * Parses a Dictionary Structured Field value.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param input The string to parse.
 * @returns The parsed Dictionary.
 * @throws {SyntaxError} If the input is invalid.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc9651#section-4.2.2}
 *
 * @example Usage
 * ```ts
 * import { parseDictionary } from "@std/http/unstable-structured-fields";
 * import { assertEquals } from "@std/assert";
 *
 * const dict = parseDictionary('profile="https://example.com"');
 * assertEquals(dict.has("profile"), true);
 * ```
 */
export function parseDictionary(input: string): Dictionary {
  const state: ParserState = { input, pos: 0 };
  skipSP(state);
  const dict = parseDictionaryInternal(state);
  skipSP(state);
  if (!isEof(state)) {
    throw new SyntaxError(
      `Invalid structured field: unexpected character at position ${state.pos}`,
    );
  }
  return dict;
}

function parseDictionaryInternal(state: ParserState): Dictionary {
  const dict: Map<string, Item | InnerList> = new Map();

  while (!isEof(state)) {
    const key = parseKey(state);
    let member: Item | InnerList;

    if (peek(state) === "=") {
      consume(state); // consume '='
      member = parseItemOrInnerList(state);
    } else {
      // Bare key means boolean true with parameters
      const parameters = parseParameters(state);
      member = {
        value: { type: "boolean", value: true },
        parameters,
      };
    }

    dict.set(key, member);
    skipOWS(state);
    if (isEof(state)) {
      return dict;
    }
    if (peek(state) !== ",") {
      throw new SyntaxError(
        `Invalid structured field: expected ',' at position ${state.pos}`,
      );
    }
    consume(state); // consume ','
    skipOWS(state);
    if (isEof(state)) {
      throw new SyntaxError(
        "Invalid structured field: trailing comma in dictionary",
      );
    }
  }

  return dict;
}

/**
 * Parses an Item Structured Field value.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param input The string to parse.
 * @returns The parsed Item.
 * @throws {SyntaxError} If the input is invalid.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc9651#section-4.2.3}
 *
 * @example Usage
 * ```ts
 * import { parseItem } from "@std/http/unstable-structured-fields";
 * import { assertEquals } from "@std/assert";
 *
 * const item = parseItem("42");
 * assertEquals(item.value, { type: "integer", value: 42 });
 * ```
 */
export function parseItem(input: string): Item {
  const state: ParserState = { input, pos: 0 };
  skipSP(state);
  const item = parseItemInternal(state);
  skipSP(state);
  if (!isEof(state)) {
    throw new SyntaxError(
      `Invalid structured field: unexpected character at position ${state.pos}`,
    );
  }
  return item;
}

function parseItemOrInnerList(state: ParserState): Item | InnerList {
  if (peek(state) === "(") {
    return parseInnerList(state);
  }
  return parseItemInternal(state);
}

function parseInnerList(state: ParserState): InnerList {
  if (consume(state) !== "(") {
    throw new SyntaxError(
      `Invalid structured field: expected '(' at position ${state.pos - 1}`,
    );
  }

  const items: Item[] = [];

  while (!isEof(state)) {
    skipSP(state);
    if (peek(state) === ")") {
      consume(state);
      const parameters = parseParameters(state);
      return { items, parameters };
    }
    const item = parseItemInternal(state);
    items.push(item);

    const c = peek(state);
    if (c !== " " && c !== ")") {
      throw new SyntaxError(
        `Invalid structured field: expected SP or ')' at position ${state.pos}`,
      );
    }
  }

  throw new SyntaxError(
    "Invalid structured field: unterminated inner list",
  );
}

function parseItemInternal(state: ParserState): Item {
  const value = parseBareItem(state);
  const parameters = parseParameters(state);
  return { value, parameters };
}

function parseBareItem(state: ParserState): BareItem {
  const c = peek(state);

  if (c === "-" || isDigit(c)) {
    return parseIntegerOrDecimal(state);
  }
  if (c === '"') {
    return parseString(state);
  }
  if (c === ":") {
    return parseBinary(state);
  }
  if (c === "?") {
    return parseBoolean(state);
  }
  if (c === "@") {
    return parseDate(state);
  }
  if (c === "%") {
    return parseDisplayString(state);
  }
  if (isAlpha(c) || c === "*") {
    return parseToken(state);
  }

  throw new SyntaxError(
    `Invalid structured field: unexpected character '${c}' at position ${state.pos}`,
  );
}

function parseIntegerOrDecimal(state: ParserState): BareItem {
  let sign = 1;
  if (peek(state) === "-") {
    consume(state);
    sign = -1;
  }

  if (!isDigit(peek(state))) {
    throw new SyntaxError(
      `Invalid structured field: expected digit at position ${state.pos}`,
    );
  }

  let integerPart = "";
  while (isDigit(peek(state))) {
    integerPart += consume(state);
    if (integerPart.length > MAX_INTEGER_DIGITS) {
      throw new SyntaxError(
        "Invalid structured field: integer too long",
      );
    }
  }

  if (peek(state) === ".") {
    consume(state); // consume '.'
    if (integerPart.length > MAX_DECIMAL_INTEGER_DIGITS) {
      throw new SyntaxError(
        "Invalid structured field: decimal integer part too long",
      );
    }

    let fractionalPart = "";
    while (isDigit(peek(state))) {
      fractionalPart += consume(state);
      if (fractionalPart.length > MAX_DECIMAL_FRACTIONAL_DIGITS) {
        throw new SyntaxError(
          "Invalid structured field: decimal fractional part too long",
        );
      }
    }

    if (fractionalPart.length === 0) {
      throw new SyntaxError(
        "Invalid structured field: decimal requires fractional digits",
      );
    }

    const value = sign * parseFloat(`${integerPart}.${fractionalPart}`);
    return { type: "decimal", value };
  }

  const value = sign * parseInt(integerPart, 10);

  if (value < -MAX_INTEGER || value > MAX_INTEGER) {
    throw new SyntaxError(
      "Invalid structured field: integer out of range",
    );
  }

  return { type: "integer", value };
}

function parseString(state: ParserState): BareItem {
  if (consume(state) !== '"') {
    throw new SyntaxError(
      `Invalid structured field: expected '"' at position ${state.pos - 1}`,
    );
  }

  const { input } = state;
  const startPos = state.pos;

  // Fast path: find first special character (\ or ")
  let firstSpecial = startPos;
  while (firstSpecial < input.length) {
    const c = input[firstSpecial]!;
    if (c === '"' || c === "\\") break;
    // Validate printable ASCII
    const code = c.charCodeAt(0);
    if (code < 0x20 || code > 0x7e) {
      throw new SyntaxError(
        `Invalid structured field: invalid character in string at position ${firstSpecial}`,
      );
    }
    firstSpecial++;
  }

  // If we hit end of string without finding closing quote
  if (firstSpecial >= input.length) {
    throw new SyntaxError("Invalid structured field: unterminated string");
  }

  // Fast path: no escapes, just a closing quote
  if (input[firstSpecial] === '"') {
    state.pos = firstSpecial + 1;
    return { type: "string", value: input.slice(startPos, firstSpecial) };
  }

  // Slow path: has escapes, need to process character by character
  let value = input.slice(startPos, firstSpecial);
  state.pos = firstSpecial;

  while (!isEof(state)) {
    const c = consume(state);

    if (c === "\\") {
      const escaped = consume(state);
      if (escaped !== '"' && escaped !== "\\") {
        throw new SyntaxError(
          `Invalid structured field: invalid escape sequence at position ${
            state.pos - 1
          }`,
        );
      }
      value += escaped;
    } else if (c === '"') {
      return { type: "string", value };
    } else {
      // Must be printable ASCII (0x20-0x7E) excluding 0x22 (") and 0x5C (\)
      const code = c.charCodeAt(0);
      if (code < 0x20 || code > 0x7e) {
        throw new SyntaxError(
          `Invalid structured field: invalid character in string at position ${
            state.pos - 1
          }`,
        );
      }
      value += c;
    }
  }

  throw new SyntaxError(
    "Invalid structured field: unterminated string",
  );
}

function parseToken(state: ParserState): BareItem {
  const first = peek(state);
  if (!isAlpha(first) && first !== "*") {
    throw new SyntaxError(
      `Invalid structured field: invalid token start at position ${state.pos}`,
    );
  }

  const startPos = state.pos;
  state.pos++; // Skip validated first char
  while (!isEof(state)) {
    const c = peek(state);
    if (isTchar(c) || c === ":" || c === "/") {
      state.pos++;
    } else {
      break;
    }
  }

  return { type: "token", value: state.input.slice(startPos, state.pos) };
}

function parseBinary(state: ParserState): BareItem {
  if (consume(state) !== ":") {
    throw new SyntaxError(
      `Invalid structured field: expected ':' at position ${state.pos - 1}`,
    );
  }

  const { input } = state;
  const startPos = state.pos;

  // Find the closing colon while validating base64 characters
  while (state.pos < input.length && input[state.pos] !== ":") {
    if (!isBase64Char(input[state.pos]!)) {
      throw new SyntaxError(
        `Invalid structured field: invalid base64 character at position ${state.pos}`,
      );
    }
    state.pos++;
  }

  if (state.pos >= input.length) {
    throw new SyntaxError(
      "Invalid structured field: unterminated binary",
    );
  }

  const base64 = input.slice(startPos, state.pos);
  state.pos++; // consume closing ':'

  try {
    const value = decodeBase64(base64);
    return { type: "binary", value };
  } catch {
    throw new SyntaxError(
      "Invalid structured field: invalid base64 encoding",
    );
  }
}

function parseBoolean(state: ParserState): BareItem {
  if (consume(state) !== "?") {
    throw new SyntaxError(
      `Invalid structured field: expected '?' at position ${state.pos - 1}`,
    );
  }

  const c = consume(state);
  if (c === "1") {
    return { type: "boolean", value: true };
  }
  if (c === "0") {
    return { type: "boolean", value: false };
  }

  throw new SyntaxError(
    `Invalid structured field: expected '0' or '1' at position ${
      state.pos - 1
    }`,
  );
}

function parseDate(state: ParserState): BareItem {
  if (consume(state) !== "@") {
    throw new SyntaxError(
      `Invalid structured field: expected '@' at position ${state.pos - 1}`,
    );
  }

  const intItem = parseIntegerOrDecimal(state);
  if (intItem.type !== "integer") {
    throw new SyntaxError(
      "Invalid structured field: date must be an integer",
    );
  }

  const value = new Date(intItem.value * 1000);
  return { type: "date", value };
}

function parseDisplayString(state: ParserState): BareItem {
  if (consume(state) !== "%") {
    throw new SyntaxError(
      `Invalid structured field: expected '%' at position ${state.pos - 1}`,
    );
  }
  if (consume(state) !== '"') {
    throw new SyntaxError(
      `Invalid structured field: expected '"' at position ${state.pos - 1}`,
    );
  }

  const bytes: number[] = [];
  while (!isEof(state)) {
    const c = consume(state);

    if (c === '"') {
      // Decode UTF-8 bytes to string
      try {
        const value = UTF8_DECODER.decode(new Uint8Array(bytes));
        return { type: "displaystring", value };
      } catch {
        throw new SyntaxError(
          "Invalid structured field: invalid UTF-8 in display string",
        );
      }
    } else if (c === "%") {
      // Percent-encoded byte
      const hex1 = consume(state);
      const hex2 = consume(state);
      if (!isLcHexDigit(hex1) || !isLcHexDigit(hex2)) {
        throw new SyntaxError(
          `Invalid structured field: invalid percent encoding at position ${
            state.pos - 2
          }`,
        );
      }
      bytes.push(parseInt(hex1 + hex2, 16));
    } else {
      // Must be allowed unescaped character per RFC 9651:
      // unescaped = %x20-21 / %x23-24 / %x26-5B / %x5D-7E
      // (space, !, #, $, &-[, ]-~)
      // Note: " (0x22) and % (0x25) must be percent-encoded
      // Note: Per conformance tests, \ (0x5C) is also allowed
      const code = c.charCodeAt(0);
      const isAllowed = code === 0x20 || code === 0x21 || // space, !
        code === 0x23 || code === 0x24 || // #, $
        (code >= 0x26 && code <= 0x5b) || // &-[
        (code >= 0x5c && code <= 0x7e); // \-~ (includes \ per conformance tests)
      if (!isAllowed) {
        throw new SyntaxError(
          `Invalid structured field: invalid character in display string at position ${
            state.pos - 1
          }`,
        );
      }
      bytes.push(code);
    }
  }

  throw new SyntaxError(
    "Invalid structured field: unterminated display string",
  );
}

function parseKey(state: ParserState): string {
  if (!isKeyStart(peek(state))) {
    throw new SyntaxError(
      `Invalid structured field: invalid key start at position ${state.pos}`,
    );
  }

  const startPos = state.pos;
  state.pos++; // Skip validated first char
  while (!isEof(state) && isKeyChar(peek(state))) {
    state.pos++;
  }

  return state.input.slice(startPos, state.pos);
}

function parseParameters(state: ParserState): Parameters {
  const parameters: Map<string, BareItem> = new Map();

  while (peek(state) === ";") {
    consume(state); // consume ';'
    skipSP(state);
    const key = parseKey(state);

    let value: BareItem;
    if (peek(state) === "=") {
      consume(state); // consume '='
      value = parseBareItem(state);
    } else {
      value = { type: "boolean", value: true };
    }

    parameters.set(key, value);
  }

  return parameters;
}

// =============================================================================
// Serialization (RFC 9651 Section 4.1)
// =============================================================================

/**
 * Serializes a List to a string.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param list The List to serialize.
 * @returns The serialized string.
 * @throws {TypeError} If the list contains invalid values.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc9651#section-4.1.1}
 *
 * @example Usage
 * ```ts
 * import { item, serializeList, integer } from "@std/http/unstable-structured-fields";
 * import { assertEquals } from "@std/assert";
 *
 * const list = [item(integer(1)), item(integer(42))];
 *
 * assertEquals(serializeList(list), "1, 42");
 * ```
 */
export function serializeList(list: List): string {
  const parts: string[] = [];

  for (const member of list) {
    if ("items" in member) {
      parts.push(serializeInnerList(member));
    } else {
      parts.push(serializeItemInternal(member));
    }
  }

  return parts.join(", ");
}

/**
 * Serializes a Dictionary to a string.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param dict The Dictionary to serialize.
 * @returns The serialized string.
 * @throws {TypeError} If the dictionary contains invalid values.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc9651#section-4.1.2}
 *
 * @example Usage
 * ```ts
 * import { item, serializeDictionary, string } from "@std/http/unstable-structured-fields";
 * import { assertEquals } from "@std/assert";
 *
 * const dict = new Map([
 *   ["key", item(string("value"))],
 * ]);
 *
 * assertEquals(serializeDictionary(dict), 'key="value"');
 * ```
 */
export function serializeDictionary(dict: Dictionary): string {
  const parts: string[] = [];

  for (const [key, member] of dict) {
    validateKey(key);

    if ("items" in member) {
      // Inner list
      parts.push(`${key}=${serializeInnerList(member)}`);
    } else {
      // Item
      if (member.value.type === "boolean" && member.value.value === true) {
        // Omit =?1 for true boolean
        parts.push(key + serializeParameters(member.parameters));
      } else {
        parts.push(`${key}=${serializeItemInternal(member)}`);
      }
    }
  }

  return parts.join(", ");
}

/**
 * Serializes an Item to a string.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param item The Item to serialize.
 * @returns The serialized string.
 * @throws {TypeError} If the item contains invalid values.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc9651#section-4.1.3}
 *
 * @example Usage
 * ```ts
 * import { item, serializeItem, integer } from "@std/http/unstable-structured-fields";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(serializeItem(item(integer(42))), "42");
 * ```
 */
export function serializeItem(value: Item): string {
  return serializeItemInternal(value);
}

function serializeInnerList(innerList: InnerList): string {
  const items = innerList.items.map(serializeItemInternal).join(" ");
  return `(${items})${serializeParameters(innerList.parameters)}`;
}

function serializeItemInternal(item: Item): string {
  return serializeBareItem(item.value) + serializeParameters(item.parameters);
}

function serializeBareItem(bareItem: BareItem): string {
  switch (bareItem.type) {
    case "integer":
      return serializeInteger(bareItem.value);
    case "decimal":
      return serializeDecimal(bareItem.value);
    case "string":
      return serializeString(bareItem.value);
    case "token":
      return serializeToken(bareItem.value);
    case "binary":
      return serializeBinary(bareItem.value);
    case "boolean":
      return serializeBoolean(bareItem.value);
    case "date":
      return serializeDate(bareItem.value);
    case "displaystring":
      return serializeDisplayString(bareItem.value);
  }
}

function serializeInteger(value: number): string {
  if (!Number.isInteger(value)) {
    throw new TypeError("Integer must be a whole number");
  }
  if (value < -MAX_INTEGER || value > MAX_INTEGER) {
    throw new TypeError("Integer out of range");
  }
  return String(value);
}

function serializeDecimal(value: number): string {
  if (!Number.isFinite(value)) {
    throw new TypeError("Decimal must be finite");
  }

  // Round to MAX_DECIMAL_FRACTIONAL_DIGITS decimal places
  const scale = 10 ** MAX_DECIMAL_FRACTIONAL_DIGITS;
  const rounded = Math.round(value * scale) / scale;

  // Check integer part (max MAX_DECIMAL_INTEGER_DIGITS digits)
  const intPart = Math.trunc(Math.abs(rounded));
  if (intPart > MAX_DECIMAL_INTEGER_PART) {
    throw new TypeError("Decimal integer part too large");
  }

  // Format with MAX_DECIMAL_FRACTIONAL_DIGITS fractional digits
  const str = rounded.toFixed(MAX_DECIMAL_FRACTIONAL_DIGITS);

  // Remove trailing zeros but keep at least one digit after decimal
  let end = str.length;
  while (end > 0 && str[end - 1] === "0") {
    end--;
  }
  // Keep at least one digit after decimal point
  const dotIndex = str.indexOf(".");
  if (end <= dotIndex + 1) {
    end = dotIndex + 2;
  }

  return str.slice(0, end);
}

function serializeString(value: string): string {
  // Validate ASCII printable and check if escaping needed
  let needsEscape = false;
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code < 0x20 || code > 0x7e) {
      throw new TypeError(`Invalid character in string at position ${i}`);
    }
    if (code === 0x22 || code === 0x5c) { // " or \
      needsEscape = true;
    }
  }

  // Fast path: no escaping needed
  if (!needsEscape) {
    return `"${value}"`;
  }

  // Slow path: escape \ and "
  const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}"`;
}

function serializeToken(value: string): string {
  if (value.length === 0) {
    throw new TypeError("Token cannot be empty");
  }

  const first = value[0]!;
  if (!isAlpha(first) && first !== "*") {
    throw new TypeError("Token must start with ALPHA or '*'");
  }

  for (let i = 1; i < value.length; i++) {
    const c = value[i]!;
    if (!isTchar(c) && c !== ":" && c !== "/") {
      throw new TypeError(`Invalid character in token at position ${i}`);
    }
  }

  return value;
}

function serializeBinary(value: Uint8Array): string {
  return `:${encodeBase64(value)}:`;
}

function serializeBoolean(value: boolean): string {
  return value ? "?1" : "?0";
}

function serializeDate(value: Date): string {
  const timestamp = Math.floor(value.getTime() / 1000);
  if (!Number.isFinite(timestamp)) {
    throw new TypeError("Invalid date");
  }
  return `@${timestamp}`;
}

function serializeDisplayString(value: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(value);

  let result = '%"';
  for (const byte of bytes) {
    if (byte === 0x25) {
      // % -> %25
      result += "%25";
    } else if (byte === 0x22) {
      // " -> %22
      result += "%22";
    } else if (byte >= 0x20 && byte <= 0x7e) {
      // Printable ASCII
      result += String.fromCharCode(byte);
    } else {
      // Percent-encode non-ASCII
      result += "%" + byte.toString(16).padStart(2, "0");
    }
  }
  result += '"';

  return result;
}

function serializeParameters(parameters: Parameters): string {
  let result = "";

  for (const [key, value] of parameters) {
    validateKey(key);
    result += ";";
    result += key;

    if (value.type !== "boolean" || value.value !== true) {
      result += "=";
      result += serializeBareItem(value);
    }
  }

  return result;
}

function validateKey(key: string): void {
  if (key.length === 0) {
    throw new TypeError("Key cannot be empty");
  }

  if (!isKeyStart(key[0]!)) {
    throw new TypeError("Key must start with lowercase letter or '*'");
  }

  for (let i = 1; i < key.length; i++) {
    if (!isKeyChar(key[i]!)) {
      throw new TypeError(`Invalid character in key at position ${i}`);
    }
  }
}
