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
  assertEquals(decodeEntities("&lt;", false), "<");
  assertEquals(decodeEntities("&gt;", false), ">");
  assertEquals(decodeEntities("&amp;", false), "&");
  assertEquals(decodeEntities("&apos;", false), "'");
  assertEquals(decodeEntities("&quot;", false), '"');
});

Deno.test("decodeEntities() decodes multiple entities in a string", () => {
  assertEquals(
    decodeEntities("&lt;hello&gt; &amp; &quot;world&quot;", false),
    '<hello> & "world"',
  );
});

Deno.test("decodeEntities() decodes decimal character references", () => {
  assertEquals(decodeEntities("&#60;", false), "<");
  assertEquals(decodeEntities("&#62;", false), ">");
  assertEquals(decodeEntities("&#38;", false), "&");
  assertEquals(decodeEntities("&#39;", false), "'");
  assertEquals(decodeEntities("&#34;", false), '"');
  assertEquals(decodeEntities("&#65;", false), "A");
  assertEquals(decodeEntities("&#8364;", false), "€");
});

Deno.test("decodeEntities() decodes hexadecimal character references", () => {
  assertEquals(decodeEntities("&#x3C;", false), "<");
  assertEquals(decodeEntities("&#x3c;", false), "<");
  assertEquals(decodeEntities("&#x3E;", false), ">");
  assertEquals(decodeEntities("&#x26;", false), "&");
  assertEquals(decodeEntities("&#x27;", false), "'");
  assertEquals(decodeEntities("&#x22;", false), '"');
  assertEquals(decodeEntities("&#x41;", false), "A");
  assertEquals(decodeEntities("&#x20AC;", false), "€");
});

Deno.test("decodeEntities() throws on unknown entities", () => {
  assertThrows(
    () => decodeEntities("&unknown;", false),
    Error,
    "Unknown entity '&unknown;'",
  );
  assertThrows(
    () => decodeEntities("&nbsp;", false),
    Error,
    "Unknown entity '&nbsp;'",
  );
});

Deno.test("decodeEntities() handles text without entities", () => {
  assertEquals(decodeEntities("hello world", false), "hello world");
  assertEquals(decodeEntities("", false), "");
});

Deno.test("decodeEntities() throws on incomplete entity-like patterns", () => {
  assertThrows(
    () => decodeEntities("a & b", false),
    Error,
    "Invalid bare '&'",
  );
  assertThrows(
    () => decodeEntities("foo &bar", false),
    Error,
    "Invalid bare '&'",
  );
  assertThrows(
    () => decodeEntities("&;", false),
    Error,
    "Invalid bare '&'",
  );
});

Deno.test("decodeEntities() throws on invalid code points", () => {
  // Code points exceeding max Unicode (0x10FFFF) are invalid
  assertThrows(
    () => decodeEntities("&#x110000;", false),
    Error,
    "Invalid character reference",
  );
  assertThrows(
    () => decodeEntities("&#1114112;", false),
    Error,
    "Invalid character reference",
  );
  assertThrows(
    () => decodeEntities("&#999999999;", false),
    Error,
    "Invalid character reference",
  );
});

Deno.test("decodeEntities() handles max valid Unicode code point", () => {
  // 0x10FFFF is the maximum valid Unicode code point
  assertEquals(decodeEntities("&#x10FFFF;", false), "\u{10FFFF}");
  assertEquals(decodeEntities("&#1114111;", false), "\u{10FFFF}");
});

Deno.test("decodeEntities() handles leading zeros in character references", () => {
  assertEquals(decodeEntities("&#0065;", false), "A");
  assertEquals(decodeEntities("&#x0041;", false), "A");
  assertEquals(decodeEntities("&#00000000065;", false), "A");
});

Deno.test("decodeEntities() handles consecutive entities", () => {
  assertEquals(decodeEntities("&amp;&amp;", false), "&&");
  assertEquals(decodeEntities("&lt;&gt;", false), "<>");
  assertEquals(decodeEntities("&#65;&#66;&#67;", false), "ABC");
});

// =============================================================================
// decodeEntities bare & validation tests
// =============================================================================

Deno.test("decodeEntities() throws on bare &", () => {
  assertThrows(
    () => decodeEntities("foo&bar", false),
    Error,
    "Invalid bare '&' at position 3",
  );
});

Deno.test("decodeEntities() throws on & at end", () => {
  assertThrows(
    () => decodeEntities("trailing&", false),
    Error,
    "Invalid bare '&' at position 8",
  );
});

Deno.test("decodeEntities() throws on & followed by space", () => {
  assertThrows(
    () => decodeEntities("a & b", false),
    Error,
    "Invalid bare '&' at position 2",
  );
});

Deno.test("decodeEntities() throws on & in URL query strings", () => {
  assertThrows(
    () => decodeEntities("http://example.com?a=1&b=2", false),
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
  const decoded = decodeEntities(encoded, false);
  assertEquals(decoded, original);
});

// =============================================================================
// Additional edge case tests
// =============================================================================

Deno.test("decodeEntities() throws on empty hex reference", () => {
  assertThrows(
    () => decodeEntities("&#x;", false),
    Error,
    "Invalid bare '&'",
  );
});

Deno.test("decodeEntities() throws on invalid hex digits", () => {
  assertThrows(
    () => decodeEntities("&#xGG;", false),
    Error,
    "Invalid bare '&'",
  );
  assertThrows(
    () => decodeEntities("&#xZZ;", false),
    Error,
    "Invalid bare '&'",
  );
});

Deno.test("decodeEntities() throws on empty decimal reference", () => {
  assertThrows(
    () => decodeEntities("&#;", false),
    Error,
    "Invalid bare '&'",
  );
});

Deno.test("decodeEntities() throws on surrogate code points", () => {
  // U+D800-U+DFFF are surrogate pairs, invalid per XML 1.0 §2.2
  assertThrows(
    () => decodeEntities("&#xD800;", false),
    Error,
    "Invalid character reference",
  );
  assertThrows(
    () => decodeEntities("&#xDFFF;", false),
    Error,
    "Invalid character reference",
  );
  assertThrows(
    () => decodeEntities("&#xDBFF;", false),
    Error,
    "Invalid character reference",
  );
  // Decimal surrogates (55296 = 0xD800, 57343 = 0xDFFF)
  assertThrows(
    () => decodeEntities("&#55296;", false),
    Error,
    "Invalid character reference",
  );
  assertThrows(
    () => decodeEntities("&#57343;", false),
    Error,
    "Invalid character reference",
  );
});

Deno.test("decodeEntities() throws on invalid XML characters per §2.2", () => {
  // XML 1.0 §4.1 WFC: Legal Character - char refs must match Char production
  // Char ::= #x9 | #xA | #xD | [#x20-#xD7FF] | [#xE000-#xFFFD] | [#x10000-#x10FFFF]

  // NULL (#x0) is invalid
  assertThrows(
    () => decodeEntities("&#0;", false),
    Error,
    "Invalid character reference",
  );
  assertThrows(
    () => decodeEntities("&#x0;", false),
    Error,
    "Invalid character reference",
  );

  // Control characters #x1-#x8 are invalid
  assertThrows(
    () => decodeEntities("&#1;", false),
    Error,
    "Invalid character reference",
  );
  assertThrows(
    () => decodeEntities("&#x1;", false),
    Error,
    "Invalid character reference",
  );
  assertThrows(
    () => decodeEntities("&#8;", false),
    Error,
    "Invalid character reference",
  );
  assertThrows(
    () => decodeEntities("&#x8;", false),
    Error,
    "Invalid character reference",
  );

  // #xB and #xC are invalid (but #x9, #xA, #xD are valid)
  assertThrows(
    () => decodeEntities("&#11;", false),
    Error,
    "Invalid character reference",
  );
  assertThrows(
    () => decodeEntities("&#xB;", false),
    Error,
    "Invalid character reference",
  );
  assertThrows(
    () => decodeEntities("&#12;", false),
    Error,
    "Invalid character reference",
  );
  assertThrows(
    () => decodeEntities("&#xC;", false),
    Error,
    "Invalid character reference",
  );

  // Control characters #xE-#x1F are invalid
  assertThrows(
    () => decodeEntities("&#14;", false),
    Error,
    "Invalid character reference",
  );
  assertThrows(
    () => decodeEntities("&#xE;", false),
    Error,
    "Invalid character reference",
  );
  assertThrows(
    () => decodeEntities("&#31;", false),
    Error,
    "Invalid character reference",
  );
  assertThrows(
    () => decodeEntities("&#x1F;", false),
    Error,
    "Invalid character reference",
  );

  // #xFFFE and #xFFFF are invalid
  assertThrows(
    () => decodeEntities("&#xFFFE;", false),
    Error,
    "Invalid character reference",
  );
  assertThrows(
    () => decodeEntities("&#xFFFF;", false),
    Error,
    "Invalid character reference",
  );
  assertThrows(
    () => decodeEntities("&#65534;", false),
    Error,
    "Invalid character reference",
  );
  assertThrows(
    () => decodeEntities("&#65535;", false),
    Error,
    "Invalid character reference",
  );
});

Deno.test("decodeEntities() allows valid XML whitespace characters", () => {
  // #x9 (tab), #xA (newline), #xD (carriage return) are valid
  assertEquals(decodeEntities("&#9;", false), "\t");
  assertEquals(decodeEntities("&#x9;", false), "\t");
  assertEquals(decodeEntities("&#10;", false), "\n");
  assertEquals(decodeEntities("&#xA;", false), "\n");
  assertEquals(decodeEntities("&#13;", false), "\r");
  assertEquals(decodeEntities("&#xD;", false), "\r");
});

Deno.test("decodeEntities() throws on mixed valid and invalid references", () => {
  // Throws on the first invalid reference encountered
  assertThrows(
    () => decodeEntities("&lt;&invalid;&gt;", false),
    Error,
    "Unknown entity '&invalid;'",
  );
  assertThrows(
    () => decodeEntities("&amp;&#999999999;&amp;", false),
    Error,
    "Invalid character reference",
  );
});

Deno.test("decodeEntities() handles entity at start and end", () => {
  assertEquals(decodeEntities("&lt;text&gt;", false), "<text>");
  assertEquals(decodeEntities("&amp;", false), "&");
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

// =============================================================================
// XML 1.1 decodeEntities tests
// =============================================================================

Deno.test("decodeEntities() xml11 accepts C0 control char refs that XML 1.0 rejects", () => {
  assertEquals(decodeEntities("&#x1;", true), "\x01");
  assertEquals(decodeEntities("&#x2;", true), "\x02");
  assertEquals(decodeEntities("&#x8;", true), "\x08");
  assertEquals(decodeEntities("&#xB;", true), "\x0B");
  assertEquals(decodeEntities("&#xC;", true), "\x0C");
  assertEquals(decodeEntities("&#xE;", true), "\x0E");
  assertEquals(decodeEntities("&#x1F;", true), "\x1F");
});

Deno.test("decodeEntities() xml11 accepts C1 control char refs", () => {
  assertEquals(decodeEntities("&#x7F;", true), "\x7F");
  assertEquals(decodeEntities("&#x80;", true), "\x80");
  assertEquals(decodeEntities("&#x85;", true), "\x85");
  assertEquals(decodeEntities("&#x9F;", true), "\x9F");
});

Deno.test("decodeEntities() xml11 still rejects NULL (&#x0;)", () => {
  assertThrows(
    () => decodeEntities("&#x0;", true),
    Error,
    "Invalid character reference",
  );
});

Deno.test("decodeEntities() xml10 rejects C0 control char refs", () => {
  assertThrows(
    () => decodeEntities("&#x1;", false),
    Error,
    "Invalid character reference",
  );
  assertThrows(
    () => decodeEntities("&#x2;", false),
    Error,
    "Invalid character reference",
  );
  assertThrows(
    () => decodeEntities("&#x8;", false),
    Error,
    "Invalid character reference",
  );
});

Deno.test("decodeEntities() xml11 decimal char refs for controls", () => {
  assertEquals(decodeEntities("&#1;", true), "\x01");
  assertEquals(decodeEntities("&#31;", true), "\x1F");
});

Deno.test("decodeEntities() xml11 rejects noncharacters U+FFFE and U+FFFF", () => {
  assertThrows(
    () => decodeEntities("&#xFFFE;", true),
    Error,
    "Invalid character reference",
  );
  assertThrows(
    () => decodeEntities("&#xFFFF;", true),
    Error,
    "Invalid character reference",
  );
});

Deno.test("decodeEntities() xml11 rejects surrogate code points", () => {
  assertThrows(
    () => decodeEntities("&#xD800;", true),
    Error,
    "Invalid character reference",
  );
  assertThrows(
    () => decodeEntities("&#xDFFF;", true),
    Error,
    "Invalid character reference",
  );
});

Deno.test("decodeEntities() xml11 accepts supplementary plane characters", () => {
  assertEquals(decodeEntities("&#x10000;", true), "\u{10000}");
  assertEquals(decodeEntities("&#x10FFFF;", true), "\u{10FFFF}");
});

Deno.test("decodeEntities() xml11 accepts BMP boundary characters", () => {
  assertEquals(decodeEntities("&#xD7FF;", true), "\uD7FF");
  assertEquals(decodeEntities("&#xE000;", true), "\uE000");
  assertEquals(decodeEntities("&#xFFFD;", true), "\uFFFD");
});
