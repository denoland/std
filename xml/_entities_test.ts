// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertThrows } from "@std/assert";
import {
  decodeEntities,
  encodeAttributeValue,
  encodeEntities,
} from "./_entities.ts";

// =============================================================================
// decodeEntities tests
// =============================================================================

Deno.test("decodeEntities() decodes predefined entities", () => {
  assertEquals(decodeEntities("&lt;"), "<");
  assertEquals(decodeEntities("&gt;"), ">");
  assertEquals(decodeEntities("&amp;"), "&");
  assertEquals(decodeEntities("&apos;"), "'");
  assertEquals(decodeEntities("&quot;"), '"');
});

Deno.test("decodeEntities() decodes multiple entities in a string", () => {
  assertEquals(
    decodeEntities("&lt;hello&gt; &amp; &quot;world&quot;"),
    '<hello> & "world"',
  );
});

Deno.test("decodeEntities() decodes decimal character references", () => {
  assertEquals(decodeEntities("&#60;"), "<");
  assertEquals(decodeEntities("&#62;"), ">");
  assertEquals(decodeEntities("&#38;"), "&");
  assertEquals(decodeEntities("&#39;"), "'");
  assertEquals(decodeEntities("&#34;"), '"');
  assertEquals(decodeEntities("&#65;"), "A");
  assertEquals(decodeEntities("&#8364;"), "€");
});

Deno.test("decodeEntities() decodes hexadecimal character references", () => {
  assertEquals(decodeEntities("&#x3C;"), "<");
  assertEquals(decodeEntities("&#x3c;"), "<");
  assertEquals(decodeEntities("&#x3E;"), ">");
  assertEquals(decodeEntities("&#x26;"), "&");
  assertEquals(decodeEntities("&#x27;"), "'");
  assertEquals(decodeEntities("&#x22;"), '"');
  assertEquals(decodeEntities("&#x41;"), "A");
  assertEquals(decodeEntities("&#x20AC;"), "€");
});

Deno.test("decodeEntities() leaves unknown entities unchanged", () => {
  assertEquals(decodeEntities("&unknown;"), "&unknown;");
  assertEquals(decodeEntities("&nbsp;"), "&nbsp;");
});

Deno.test("decodeEntities() handles text without entities", () => {
  assertEquals(decodeEntities("hello world"), "hello world");
  assertEquals(decodeEntities(""), "");
});

Deno.test("decodeEntities() handles incomplete entity-like patterns", () => {
  assertEquals(decodeEntities("a & b"), "a & b");
  assertEquals(decodeEntities("foo &bar"), "foo &bar");
  assertEquals(decodeEntities("&;"), "&;");
});

Deno.test("decodeEntities() handles invalid code points gracefully", () => {
  // Code points exceeding max Unicode (0x10FFFF) are returned as-is
  assertEquals(decodeEntities("&#x110000;"), "&#x110000;");
  assertEquals(decodeEntities("&#1114112;"), "&#1114112;");
  assertEquals(decodeEntities("&#999999999;"), "&#999999999;");
});

Deno.test("decodeEntities() handles max valid Unicode code point", () => {
  // 0x10FFFF is the maximum valid Unicode code point
  assertEquals(decodeEntities("&#x10FFFF;"), "\u{10FFFF}");
  assertEquals(decodeEntities("&#1114111;"), "\u{10FFFF}");
});

Deno.test("decodeEntities() handles leading zeros in character references", () => {
  assertEquals(decodeEntities("&#0065;"), "A");
  assertEquals(decodeEntities("&#x0041;"), "A");
  assertEquals(decodeEntities("&#00000000065;"), "A");
});

Deno.test("decodeEntities() handles consecutive entities", () => {
  assertEquals(decodeEntities("&amp;&amp;"), "&&");
  assertEquals(decodeEntities("&lt;&gt;"), "<>");
  assertEquals(decodeEntities("&#65;&#66;&#67;"), "ABC");
});

// =============================================================================
// decodeEntities strict mode tests
// =============================================================================

Deno.test("decodeEntities() strict mode throws on bare &", () => {
  assertThrows(
    () => decodeEntities("foo&bar", { strict: true }),
    Error,
    "Invalid bare '&' at position 3",
  );
});

Deno.test("decodeEntities() strict mode throws on & at end", () => {
  assertThrows(
    () => decodeEntities("trailing&", { strict: true }),
    Error,
    "Invalid bare '&' at position 8",
  );
});

Deno.test("decodeEntities() strict mode throws on & followed by space", () => {
  assertThrows(
    () => decodeEntities("a & b", { strict: true }),
    Error,
    "Invalid bare '&' at position 2",
  );
});

Deno.test("decodeEntities() strict mode allows valid entity references", () => {
  // Should not throw
  assertEquals(decodeEntities("&amp;", { strict: true }), "&");
  assertEquals(decodeEntities("&lt;&gt;", { strict: true }), "<>");
  assertEquals(decodeEntities("&#65;", { strict: true }), "A");
  assertEquals(decodeEntities("&#x41;", { strict: true }), "A");
});

Deno.test("decodeEntities() strict mode allows unknown named entities", () => {
  // Unknown named entities like &nbsp; are valid syntax (just not decoded)
  assertEquals(decodeEntities("&nbsp;", { strict: true }), "&nbsp;");
  assertEquals(decodeEntities("&foo;", { strict: true }), "&foo;");
});

Deno.test("decodeEntities() lenient mode (default) passes through bare &", () => {
  // Default behavior: pass through
  assertEquals(decodeEntities("foo&bar"), "foo&bar");
  assertEquals(decodeEntities("a & b"), "a & b");
  assertEquals(decodeEntities("trailing&"), "trailing&");
});

Deno.test("decodeEntities() strict mode detects & in attribute-like values", () => {
  // Common case: URL query strings in attributes
  assertThrows(
    () => decodeEntities("http://example.com?a=1&b=2", { strict: true }),
    Error,
    "Invalid bare '&'",
  );
});

// =============================================================================
// encodeEntities tests
// =============================================================================

Deno.test("encodeEntities() encodes special characters", () => {
  assertEquals(encodeEntities("<"), "&lt;");
  assertEquals(encodeEntities(">"), "&gt;");
  assertEquals(encodeEntities("&"), "&amp;");
  assertEquals(encodeEntities("'"), "&apos;");
  assertEquals(encodeEntities('"'), "&quot;");
});

Deno.test("encodeEntities() encodes multiple special characters", () => {
  assertEquals(
    encodeEntities('<hello> & "world"'),
    "&lt;hello&gt; &amp; &quot;world&quot;",
  );
});

Deno.test("encodeEntities() leaves regular text unchanged", () => {
  assertEquals(encodeEntities("hello world"), "hello world");
  assertEquals(encodeEntities(""), "");
});

Deno.test("encodeEntities() passes through Unicode unchanged", () => {
  assertEquals(encodeEntities("héllo wörld"), "héllo wörld");
  assertEquals(encodeEntities("日本語"), "日本語");
  assertEquals(encodeEntities("emoji: 🎉"), "emoji: 🎉");
});

// =============================================================================
// encodeAttributeValue tests
// =============================================================================

Deno.test("encodeAttributeValue() encodes special characters", () => {
  assertEquals(encodeAttributeValue("<>&'\""), "&lt;&gt;&amp;&apos;&quot;");
});

Deno.test("encodeAttributeValue() encodes whitespace per XML 1.0 §3.3.3", () => {
  assertEquals(encodeAttributeValue("a\tb"), "a&#9;b");
  assertEquals(encodeAttributeValue("line1\nline2"), "line1&#10;line2");
  assertEquals(encodeAttributeValue("line1\rline2"), "line1&#13;line2");
  assertEquals(encodeAttributeValue("line1\r\nline2"), "line1&#13;&#10;line2");
});

Deno.test("encodeAttributeValue() handles combined cases", () => {
  assertEquals(
    encodeAttributeValue('<value\nwith "special" chars>'),
    "&lt;value&#10;with &quot;special&quot; chars&gt;",
  );
});

// =============================================================================
// Round-trip tests
// =============================================================================

Deno.test("decodeEntities and encodeEntities are inverse operations for basic entities", () => {
  const original = '<hello> & "world"';
  const encoded = encodeEntities(original);
  const decoded = decodeEntities(encoded);
  assertEquals(decoded, original);
});

// =============================================================================
// Additional edge case tests
// =============================================================================

Deno.test("decodeEntities() handles empty hex reference", () => {
  // &#x; is not a valid pattern, should pass through
  assertEquals(decodeEntities("&#x;"), "&#x;");
});

Deno.test("decodeEntities() handles invalid hex digits", () => {
  // G is not a hex digit, should pass through
  assertEquals(decodeEntities("&#xGG;"), "&#xGG;");
  assertEquals(decodeEntities("&#xZZ;"), "&#xZZ;");
});

Deno.test("decodeEntities() handles empty decimal reference", () => {
  // &#; is not valid
  assertEquals(decodeEntities("&#;"), "&#;");
});

Deno.test("decodeEntities() handles surrogate code points gracefully", () => {
  // U+D800-U+DFFF are surrogate pairs, invalid as single code points in Unicode
  // String.fromCodePoint(0xD800) throws RangeError
  // Our implementation returns the original reference for invalid surrogates
  assertEquals(decodeEntities("&#xD800;"), "&#xD800;");
  assertEquals(decodeEntities("&#xDFFF;"), "&#xDFFF;");
  assertEquals(decodeEntities("&#xDBFF;"), "&#xDBFF;");
  // Decimal surrogates (55296 = 0xD800, 57343 = 0xDFFF)
  assertEquals(decodeEntities("&#55296;"), "&#55296;");
  assertEquals(decodeEntities("&#57343;"), "&#57343;");
});

Deno.test("decodeEntities() rejects invalid XML characters per §2.2", () => {
  // XML 1.0 §4.1 WFC: Legal Character - char refs must match Char production
  // Char ::= #x9 | #xA | #xD | [#x20-#xD7FF] | [#xE000-#xFFFD] | [#x10000-#x10FFFF]

  // NULL (#x0) is invalid
  assertEquals(decodeEntities("&#0;"), "&#0;");
  assertEquals(decodeEntities("&#x0;"), "&#x0;");

  // Control characters #x1-#x8 are invalid
  assertEquals(decodeEntities("&#1;"), "&#1;");
  assertEquals(decodeEntities("&#x1;"), "&#x1;");
  assertEquals(decodeEntities("&#8;"), "&#8;");
  assertEquals(decodeEntities("&#x8;"), "&#x8;");

  // #xB and #xC are invalid (but #x9, #xA, #xD are valid)
  assertEquals(decodeEntities("&#11;"), "&#11;");
  assertEquals(decodeEntities("&#xB;"), "&#xB;");
  assertEquals(decodeEntities("&#12;"), "&#12;");
  assertEquals(decodeEntities("&#xC;"), "&#xC;");

  // Control characters #xE-#x1F are invalid
  assertEquals(decodeEntities("&#14;"), "&#14;");
  assertEquals(decodeEntities("&#xE;"), "&#xE;");
  assertEquals(decodeEntities("&#31;"), "&#31;");
  assertEquals(decodeEntities("&#x1F;"), "&#x1F;");

  // #xFFFE and #xFFFF are invalid
  assertEquals(decodeEntities("&#xFFFE;"), "&#xFFFE;");
  assertEquals(decodeEntities("&#xFFFF;"), "&#xFFFF;");
  assertEquals(decodeEntities("&#65534;"), "&#65534;");
  assertEquals(decodeEntities("&#65535;"), "&#65535;");
});

Deno.test("decodeEntities() allows valid XML whitespace characters", () => {
  // #x9 (tab), #xA (newline), #xD (carriage return) are valid
  assertEquals(decodeEntities("&#9;"), "\t");
  assertEquals(decodeEntities("&#x9;"), "\t");
  assertEquals(decodeEntities("&#10;"), "\n");
  assertEquals(decodeEntities("&#xA;"), "\n");
  assertEquals(decodeEntities("&#13;"), "\r");
  assertEquals(decodeEntities("&#xD;"), "\r");
});

Deno.test("decodeEntities() handles mixed valid and invalid references", () => {
  assertEquals(decodeEntities("&lt;&invalid;&gt;"), "<&invalid;>");
  assertEquals(decodeEntities("&amp;&#999999999;&amp;"), "&&#999999999;&");
});

Deno.test("decodeEntities() handles entity at start and end", () => {
  assertEquals(decodeEntities("&lt;text&gt;"), "<text>");
  assertEquals(decodeEntities("&amp;"), "&");
});

Deno.test("encodeEntities() handles all special chars adjacent", () => {
  assertEquals(encodeEntities("<>&'\""), "&lt;&gt;&amp;&apos;&quot;");
});

Deno.test("encodeAttributeValue() handles empty string", () => {
  assertEquals(encodeAttributeValue(""), "");
});

Deno.test("encodeAttributeValue() handles only whitespace", () => {
  assertEquals(encodeAttributeValue("\t\n\r"), "&#9;&#10;&#13;");
});
