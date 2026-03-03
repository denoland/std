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

Deno.test("decodeEntities() throws on unknown entities", () => {
  assertThrows(
    () => decodeEntities("&unknown;"),
    Error,
    "Unknown entity '&unknown;'",
  );
  assertThrows(
    () => decodeEntities("&nbsp;"),
    Error,
    "Unknown entity '&nbsp;'",
  );
});

Deno.test("decodeEntities() handles text without entities", () => {
  assertEquals(decodeEntities("hello world"), "hello world");
  assertEquals(decodeEntities(""), "");
});

Deno.test("decodeEntities() throws on incomplete entity-like patterns", () => {
  assertThrows(
    () => decodeEntities("a & b"),
    Error,
    "Invalid bare '&'",
  );
  assertThrows(
    () => decodeEntities("foo &bar"),
    Error,
    "Invalid bare '&'",
  );
  assertThrows(
    () => decodeEntities("&;"),
    Error,
    "Invalid bare '&'",
  );
});

Deno.test("decodeEntities() throws on invalid code points", () => {
  // Code points exceeding max Unicode (0x10FFFF) are invalid
  assertThrows(
    () => decodeEntities("&#x110000;"),
    Error,
    "Invalid character reference",
  );
  assertThrows(
    () => decodeEntities("&#1114112;"),
    Error,
    "Invalid character reference",
  );
  assertThrows(
    () => decodeEntities("&#999999999;"),
    Error,
    "Invalid character reference",
  );
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
// decodeEntities bare & validation tests
// =============================================================================

Deno.test("decodeEntities() throws on bare &", () => {
  assertThrows(
    () => decodeEntities("foo&bar"),
    Error,
    "Invalid bare '&' at position 3",
  );
});

Deno.test("decodeEntities() throws on & at end", () => {
  assertThrows(
    () => decodeEntities("trailing&"),
    Error,
    "Invalid bare '&' at position 8",
  );
});

Deno.test("decodeEntities() throws on & followed by space", () => {
  assertThrows(
    () => decodeEntities("a & b"),
    Error,
    "Invalid bare '&' at position 2",
  );
});

Deno.test("decodeEntities() throws on & in URL query strings", () => {
  assertThrows(
    () => decodeEntities("http://example.com?a=1&b=2"),
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

Deno.test("decodeEntities() throws on empty hex reference", () => {
  assertThrows(
    () => decodeEntities("&#x;"),
    Error,
    "Invalid bare '&'",
  );
});

Deno.test("decodeEntities() throws on invalid hex digits", () => {
  assertThrows(
    () => decodeEntities("&#xGG;"),
    Error,
    "Invalid bare '&'",
  );
  assertThrows(
    () => decodeEntities("&#xZZ;"),
    Error,
    "Invalid bare '&'",
  );
});

Deno.test("decodeEntities() throws on empty decimal reference", () => {
  assertThrows(
    () => decodeEntities("&#;"),
    Error,
    "Invalid bare '&'",
  );
});

Deno.test("decodeEntities() throws on surrogate code points", () => {
  // U+D800-U+DFFF are surrogate pairs, invalid per XML 1.0 §2.2
  assertThrows(
    () => decodeEntities("&#xD800;"),
    Error,
    "Invalid character reference",
  );
  assertThrows(
    () => decodeEntities("&#xDFFF;"),
    Error,
    "Invalid character reference",
  );
  assertThrows(
    () => decodeEntities("&#xDBFF;"),
    Error,
    "Invalid character reference",
  );
  // Decimal surrogates (55296 = 0xD800, 57343 = 0xDFFF)
  assertThrows(
    () => decodeEntities("&#55296;"),
    Error,
    "Invalid character reference",
  );
  assertThrows(
    () => decodeEntities("&#57343;"),
    Error,
    "Invalid character reference",
  );
});

Deno.test("decodeEntities() throws on invalid XML characters per §2.2", () => {
  // XML 1.0 §4.1 WFC: Legal Character - char refs must match Char production
  // Char ::= #x9 | #xA | #xD | [#x20-#xD7FF] | [#xE000-#xFFFD] | [#x10000-#x10FFFF]

  // NULL (#x0) is invalid
  assertThrows(
    () => decodeEntities("&#0;"),
    Error,
    "Invalid character reference",
  );
  assertThrows(
    () => decodeEntities("&#x0;"),
    Error,
    "Invalid character reference",
  );

  // Control characters #x1-#x8 are invalid
  assertThrows(
    () => decodeEntities("&#1;"),
    Error,
    "Invalid character reference",
  );
  assertThrows(
    () => decodeEntities("&#x1;"),
    Error,
    "Invalid character reference",
  );
  assertThrows(
    () => decodeEntities("&#8;"),
    Error,
    "Invalid character reference",
  );
  assertThrows(
    () => decodeEntities("&#x8;"),
    Error,
    "Invalid character reference",
  );

  // #xB and #xC are invalid (but #x9, #xA, #xD are valid)
  assertThrows(
    () => decodeEntities("&#11;"),
    Error,
    "Invalid character reference",
  );
  assertThrows(
    () => decodeEntities("&#xB;"),
    Error,
    "Invalid character reference",
  );
  assertThrows(
    () => decodeEntities("&#12;"),
    Error,
    "Invalid character reference",
  );
  assertThrows(
    () => decodeEntities("&#xC;"),
    Error,
    "Invalid character reference",
  );

  // Control characters #xE-#x1F are invalid
  assertThrows(
    () => decodeEntities("&#14;"),
    Error,
    "Invalid character reference",
  );
  assertThrows(
    () => decodeEntities("&#xE;"),
    Error,
    "Invalid character reference",
  );
  assertThrows(
    () => decodeEntities("&#31;"),
    Error,
    "Invalid character reference",
  );
  assertThrows(
    () => decodeEntities("&#x1F;"),
    Error,
    "Invalid character reference",
  );

  // #xFFFE and #xFFFF are invalid
  assertThrows(
    () => decodeEntities("&#xFFFE;"),
    Error,
    "Invalid character reference",
  );
  assertThrows(
    () => decodeEntities("&#xFFFF;"),
    Error,
    "Invalid character reference",
  );
  assertThrows(
    () => decodeEntities("&#65534;"),
    Error,
    "Invalid character reference",
  );
  assertThrows(
    () => decodeEntities("&#65535;"),
    Error,
    "Invalid character reference",
  );
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

Deno.test("decodeEntities() throws on mixed valid and invalid references", () => {
  // Throws on the first invalid reference encountered
  assertThrows(
    () => decodeEntities("&lt;&invalid;&gt;"),
    Error,
    "Unknown entity '&invalid;'",
  );
  assertThrows(
    () => decodeEntities("&amp;&#999999999;&amp;"),
    Error,
    "Invalid character reference",
  );
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
