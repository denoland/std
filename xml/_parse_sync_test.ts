// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertThrows } from "@std/assert";
import { parseSync } from "./_parse_sync.ts";
import { XmlSyntaxError } from "./types.ts";

// =============================================================================
// Line Ending Normalization (XML 1.0 §2.11)
// =============================================================================

Deno.test("parseSync() normalizes CRLF line endings", () => {
  const doc = parseSync("<root>\r\n  <item/>\r\n</root>", {
    ignoreWhitespace: true,
  });

  assertEquals(doc.root.children.length, 1);
});

Deno.test("parseSync() normalizes CR line endings", () => {
  const doc = parseSync("<root>\r  <item/>\r</root>", {
    ignoreWhitespace: true,
  });

  assertEquals(doc.root.children.length, 1);
});

// =============================================================================
// Element Name Character Ranges
// =============================================================================

Deno.test("parseSync() handles uppercase element names", () => {
  const doc = parseSync("<ROOT><ITEM/></ROOT>");

  assertEquals(doc.root.name.local, "ROOT");
  assertEquals(doc.root.children.length, 1);
  if (doc.root.children[0]!.type === "element") {
    assertEquals(doc.root.children[0]!.name.local, "ITEM");
  }
});

// =============================================================================
// XML Declaration Variations
// =============================================================================

Deno.test("parseSync() handles declaration with single quotes", () => {
  const doc = parseSync("<?xml version='1.0' encoding='UTF-8'?><root/>");

  assertEquals(doc.declaration?.version, "1.0");
  assertEquals(doc.declaration?.encoding, "UTF-8");
});

Deno.test("parseSync() handles declaration with standalone", () => {
  const doc = parseSync('<?xml version="1.0" standalone="yes"?><root/>');

  assertEquals(doc.declaration?.version, "1.0");
  assertEquals(doc.declaration?.standalone, "yes");
});

Deno.test("parseSync() handles declaration with all attributes single-quoted", () => {
  const doc = parseSync(
    "<?xml version='1.0' encoding='UTF-8' standalone='no'?><root/>",
  );

  assertEquals(doc.declaration?.version, "1.0");
  assertEquals(doc.declaration?.encoding, "UTF-8");
  assertEquals(doc.declaration?.standalone, "no");
});

// =============================================================================
// DOCTYPE Handling
// =============================================================================

Deno.test("parseSync() handles DOCTYPE with internal subset", () => {
  const doc = parseSync(`<!DOCTYPE root [
    <!ELEMENT root (#PCDATA)>
  ]><root/>`);

  assertEquals(doc.root.name.local, "root");
});

Deno.test("parseSync() handles DOCTYPE with nested brackets in internal subset", () => {
  // This tests the nested bracket depth tracking (line 313: if (input[pos] === "[") depth++)
  const doc = parseSync(`<!DOCTYPE root [
    <!-- Comment with [brackets] inside -->
    <!ENTITY test "[nested [brackets] here]">
  ]><root/>`);

  assertEquals(doc.root.name.local, "root");
});

// =============================================================================
// Empty Text Node Handling
// =============================================================================

Deno.test("parseSync() handles adjacent tags without text between them", () => {
  // This tests the empty text check (line 179: if (text.length === 0) return)
  const doc = parseSync("<root><a/><b/></root>");

  assertEquals(doc.root.children.length, 2);
  if (doc.root.children[0]!.type === "element") {
    assertEquals(doc.root.children[0]!.name.local, "a");
  }
  if (doc.root.children[1]!.type === "element") {
    assertEquals(doc.root.children[1]!.name.local, "b");
  }
});

// =============================================================================
// XML Declaration Edge Cases
// =============================================================================

Deno.test("parseSync() handles declaration with only encoding (no version)", () => {
  // This tests the fallback to "1.0" when version is missing (line 346)
  const doc = parseSync('<?xml encoding="UTF-8"?><root/>');

  assertEquals(doc.declaration?.version, "1.0");
  assertEquals(doc.declaration?.encoding, "UTF-8");
});

// =============================================================================
// Error Handling: End of Input
// =============================================================================

Deno.test("parseSync() throws on unexpected end after <", () => {
  assertThrows(
    () => parseSync("<root><"),
    XmlSyntaxError,
    "Unexpected end of input",
  );
});

Deno.test("parseSync() throws on unexpected end in start tag", () => {
  // Input ends after whitespace in tag, before any attribute or closing
  assertThrows(
    () => parseSync("<root "),
    XmlSyntaxError,
    "Unexpected end of input in start tag",
  );
});

// =============================================================================
// Error Handling: End Tags
// =============================================================================

Deno.test("parseSync() throws on missing > in end tag", () => {
  assertThrows(
    () => parseSync("<root></root"),
    XmlSyntaxError,
  );
});

Deno.test("parseSync() throws on unexpected closing tag", () => {
  assertThrows(
    () => parseSync("</orphan>"),
    XmlSyntaxError,
    "Unexpected closing tag",
  );
});

Deno.test("parseSync() throws on mismatched closing tag", () => {
  assertThrows(
    () => parseSync("<root></wrong>"),
    XmlSyntaxError,
    "Mismatched closing tag",
  );
});

Deno.test("parseSync() throws on mismatched namespaced closing tag", () => {
  assertThrows(
    () => parseSync("<ns:root></ns:wrong>"),
    XmlSyntaxError,
    "Mismatched closing tag: expected </ns:root>",
  );
});

// =============================================================================
// Error Handling: Unclosed Elements
// =============================================================================

Deno.test("parseSync() throws on unclosed element", () => {
  assertThrows(
    () => parseSync("<root><child>"),
    XmlSyntaxError,
    "Unclosed element",
  );
});

Deno.test("parseSync() throws on unclosed namespaced element", () => {
  assertThrows(
    () => parseSync("<ns:root>"),
    XmlSyntaxError,
    "Unclosed element <ns:root>",
  );
});

// =============================================================================
// Error Handling: Unterminated Constructs
// =============================================================================

Deno.test("parseSync() throws on unterminated comment", () => {
  assertThrows(
    () => parseSync("<root><!-- unterminated"),
    XmlSyntaxError,
    "Unterminated comment",
  );
});

Deno.test("parseSync() throws on unterminated CDATA", () => {
  assertThrows(
    () => parseSync("<root><![CDATA[unterminated"),
    XmlSyntaxError,
    "Unterminated CDATA",
  );
});

Deno.test("parseSync() throws on unterminated processing instruction", () => {
  assertThrows(
    () => parseSync("<?xml version='1.0'"),
    XmlSyntaxError,
    "Unterminated processing instruction",
  );
});

// =============================================================================
// Error Handling: Invalid Characters
// =============================================================================

Deno.test("parseSync() throws on unexpected character after <", () => {
  assertThrows(
    () => parseSync("<root><@invalid/></root>"),
    XmlSyntaxError,
    "Unexpected character",
  );
});

Deno.test("parseSync() throws on unexpected character in start tag", () => {
  assertThrows(
    () => parseSync("<root @/>"),
    XmlSyntaxError,
    "Unexpected character",
  );
});

// =============================================================================
// Error Handling: Attribute Errors
// =============================================================================

Deno.test("parseSync() throws on < in attribute value", () => {
  assertThrows(
    () => parseSync('<root attr="<"/>'),
    XmlSyntaxError,
    "'<' not allowed in attribute value",
  );
});

Deno.test("parseSync() throws on unterminated attribute value", () => {
  assertThrows(
    () => parseSync('<root attr="unterminated'),
    XmlSyntaxError,
    "Unterminated attribute value",
  );
});

Deno.test("parseSync() throws on missing quote for attribute value", () => {
  assertThrows(
    () => parseSync("<root attr=unquoted/>"),
    XmlSyntaxError,
    "Expected quote to start attribute value",
  );
});

Deno.test("parseSync() throws on missing = after attribute name", () => {
  assertThrows(
    () => parseSync('<root attr "value"/>'),
    XmlSyntaxError,
    "Expected '=' after attribute name",
  );
});

// =============================================================================
// Error Handling: Self-Closing Tags
// =============================================================================

Deno.test("parseSync() throws on missing > after / in self-closing tag", () => {
  assertThrows(
    () => parseSync("<root/x"),
    XmlSyntaxError,
    "Expected '>' after '/' in self-closing tag",
  );
});

// =============================================================================
// Error Handling: Markup Declarations
// =============================================================================

Deno.test("parseSync() throws on unsupported markup declaration", () => {
  assertThrows(
    () => parseSync("<root><!INVALID></root>"),
    XmlSyntaxError,
    "Unsupported markup declaration",
  );
});
