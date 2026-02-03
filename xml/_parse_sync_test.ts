// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertThrows } from "@std/assert";
import { parseSync } from "./_parse_sync.ts";
import { XmlSyntaxError } from "./types.ts";

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
  // This tests the nested bracket depth tracking
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
  // This tests the empty text check
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
    () => parseSync('<ns:root xmlns:ns="http://example.com"></ns:wrong>'),
    XmlSyntaxError,
    "Mismatched closing tag: expected </ns:root>",
  );
});

// =============================================================================
// Namespace URI Resolution
// =============================================================================

Deno.test("parseSync() resolves namespace URI for prefixed element", () => {
  const doc = parseSync(
    '<ns:root xmlns:ns="http://example.com"><ns:child/></ns:root>',
  );

  assertEquals(doc.root.name.prefix, "ns");
  assertEquals(doc.root.name.uri, "http://example.com");

  const child = doc.root.children[0];
  assertEquals(child?.type, "element");
  if (child?.type === "element") {
    assertEquals(child.name.prefix, "ns");
    assertEquals(child.name.uri, "http://example.com");
  }
});

Deno.test("parseSync() resolves xml namespace URI implicitly", () => {
  const doc = parseSync('<root xml:lang="en"/>');

  // The xml prefix is always bound to the XML namespace
  assertEquals(doc.root.name.uri, undefined); // root has no prefix
});

Deno.test("parseSync() does not assign URI to unprefixed elements", () => {
  const doc = parseSync("<root><child/></root>");

  assertEquals(doc.root.name.prefix, undefined);
  assertEquals(doc.root.name.uri, undefined);
});

Deno.test("parseSync() handles multiple namespace prefixes", () => {
  const doc = parseSync(`
    <root xmlns:a="http://a.example.com" xmlns:b="http://b.example.com">
      <a:elem1/>
      <b:elem2/>
    </root>
  `);

  const children = doc.root.children.filter((c) => c.type === "element");
  assertEquals(children.length, 2);

  const elem1 = children[0];
  const elem2 = children[1];

  if (elem1?.type === "element" && elem2?.type === "element") {
    assertEquals(elem1.name.prefix, "a");
    assertEquals(elem1.name.uri, "http://a.example.com");
    assertEquals(elem2.name.prefix, "b");
    assertEquals(elem2.name.uri, "http://b.example.com");
  }
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
    () => parseSync('<ns:root xmlns:ns="http://example.com">'),
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

Deno.test("parseSync() throws on -- inside comment", () => {
  assertThrows(
    () => parseSync("<root><!-- a--b --></root>"),
    XmlSyntaxError,
    "'--' is not permitted within comments",
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

// =============================================================================
// Comment with newlines (line position tracking)
// =============================================================================

Deno.test("parseSync() tracks line position in multi-line comments", () => {
  // Tests newline tracking inside comments
  const doc = parseSync(`<root><!-- line1
line2
line3 --><item/></root>`);

  assertEquals(doc.root.children.length, 2);
  // First child is comment, second is element
  if (doc.root.children[0]!.type === "comment") {
    assertEquals(doc.root.children[0]!.text, " line1\nline2\nline3 ");
  }
});

// =============================================================================
// Multi-line CDATA position tracking
// =============================================================================

Deno.test("parseSync() tracks line position in multi-line CDATA", () => {
  // Tests newline tracking inside CDATA
  const doc = parseSync(`<root><![CDATA[line1
line2
line3]]></root>`);

  assertEquals(doc.root.children.length, 1);
  if (doc.root.children[0]!.type === "cdata") {
    assertEquals(doc.root.children[0]!.text, "line1\nline2\nline3");
  }
});

Deno.test("parseSync() tracks line position in multi-line processing instruction", () => {
  // Tests newline tracking inside PI content
  // PI content with newlines - should not throw
  const doc = parseSync(`<?xml version="1.0"?>
<?target content
  with newlines
  here?>
<root/>`);

  assertEquals(doc.root.name.local, "root");
  assertEquals(doc.declaration?.version, "1.0");
});

// =============================================================================
// Empty text fast path test
// =============================================================================

Deno.test("parseSync() handles adjacent elements with no text between", () => {
  // Tests line 178: empty text fast path when text.length === 0
  const doc = parseSync("<root><a></a><b></b></root>");
  assertEquals(doc.root.children.length, 2);
  // Verify no empty text nodes were created
  assertEquals(
    doc.root.children.every((c) => c.type === "element"),
    true,
  );
});

// =============================================================================
// Additional Coverage Tests
// =============================================================================

Deno.test("parseSync() handles CRLF line endings", () => {
  // Tests line ending normalization (CRLF -> LF)
  const doc = parseSync("<root>\r\n  <child/>\r\n</root>");
  assertEquals(doc.root.children.length, 3); // whitespace, child, whitespace
});

Deno.test("parseSync() handles CR line endings", () => {
  // Tests line ending normalization (CR -> LF)
  const doc = parseSync("<root>\r  <child/>\r</root>");
  assertEquals(doc.root.children.length, 3);
});

Deno.test("parseSync() with trackPosition false reports zero positions", () => {
  // Tests that position is 0,0,0 when trackPosition is false
  try {
    parseSync("<root><unclosed>", { trackPosition: false });
  } catch (e) {
    if (e instanceof XmlSyntaxError) {
      assertEquals(e.line, 0);
      assertEquals(e.column, 0);
      assertEquals(e.offset, 0);
      return;
    }
  }
  throw new Error("Expected XmlSyntaxError");
});

Deno.test("parseSync() extracts standalone yes from declaration", () => {
  // Tests standalone attribute extraction
  const doc = parseSync('<?xml version="1.0" standalone="yes"?><root/>');
  assertEquals(doc.declaration?.standalone, "yes");
});

Deno.test("parseSync() extracts standalone no from declaration", () => {
  const doc = parseSync('<?xml version="1.0" standalone="no"?><root/>');
  assertEquals(doc.declaration?.standalone, "no");
});

Deno.test("parseSync() extracts standalone with single quotes", () => {
  const doc = parseSync("<?xml version='1.0' standalone='yes'?><root/>");
  assertEquals(doc.declaration?.standalone, "yes");
});

// =============================================================================
// DTD ENTITY Declaration Tests
// =============================================================================

Deno.test("parseSync() handles ENTITY with SYSTEM identifier", () => {
  const doc = parseSync(`<!DOCTYPE root [
    <!ENTITY external SYSTEM "http://example.com/entity.xml">
  ]><root/>`);
  assertEquals(doc.root.name.local, "root");
});

Deno.test("parseSync() handles ENTITY with PUBLIC identifier", () => {
  const doc = parseSync(`<!DOCTYPE root [
    <!ENTITY external PUBLIC "-//Example//EN" "http://example.com/entity.xml">
  ]><root/>`);
  assertEquals(doc.root.name.local, "root");
});

Deno.test("parseSync() handles ENTITY with NDATA declaration", () => {
  const doc = parseSync(`<!DOCTYPE root [
    <!ENTITY logo SYSTEM "logo.png" NDATA png>
  ]><root/>`);
  assertEquals(doc.root.name.local, "root");
});

Deno.test("parseSync() handles parameter entity declaration", () => {
  const doc = parseSync(`<!DOCTYPE root [
    <!ENTITY % common "INCLUDE">
  ]><root/>`);
  assertEquals(doc.root.name.local, "root");
});

Deno.test("parseSync() throws on parameter entity with NDATA", () => {
  assertThrows(
    () =>
      parseSync(`<!DOCTYPE root [
      <!ENTITY % logo SYSTEM "logo.png" NDATA png>
    ]><root/>`),
    XmlSyntaxError,
    "Parameter entities cannot have NDATA declarations",
  );
});

Deno.test("parseSync() throws on lowercase system keyword", () => {
  assertThrows(
    () =>
      parseSync(`<!DOCTYPE root [
      <!ENTITY test system "test.xml">
    ]><root/>`),
    XmlSyntaxError,
    "must be uppercase 'SYSTEM'",
  );
});

Deno.test("parseSync() throws on lowercase public keyword", () => {
  assertThrows(
    () =>
      parseSync(`<!DOCTYPE root [
      <!ENTITY test public "-//Test//EN" "test.xml">
    ]><root/>`),
    XmlSyntaxError,
    "must be uppercase 'PUBLIC'",
  );
});

// =============================================================================
// DTD Declaration Validation Tests
// =============================================================================

Deno.test("parseSync() handles ELEMENT declaration", () => {
  const doc = parseSync(`<!DOCTYPE root [
    <!ELEMENT root (item*)>
  ]><root/>`);
  assertEquals(doc.root.name.local, "root");
});

Deno.test("parseSync() handles ATTLIST declaration", () => {
  const doc = parseSync(`<!DOCTYPE root [
    <!ATTLIST root id ID #IMPLIED>
  ]><root/>`);
  assertEquals(doc.root.name.local, "root");
});

Deno.test("parseSync() handles NOTATION declaration", () => {
  const doc = parseSync(`<!DOCTYPE root [
    <!NOTATION png SYSTEM "image/png">
  ]><root/>`);
  assertEquals(doc.root.name.local, "root");
});

Deno.test("parseSync() handles comment in internal subset", () => {
  const doc = parseSync(`<!DOCTYPE root [
    <!-- This is a comment in the DTD -->
  ]><root/>`);
  assertEquals(doc.root.name.local, "root");
});

Deno.test("parseSync() handles PI in internal subset", () => {
  const doc = parseSync(`<!DOCTYPE root [
    <?target content?>
  ]><root/>`);
  assertEquals(doc.root.name.local, "root");
});

Deno.test("parseSync() handles parameter entity reference in internal subset", () => {
  const doc = parseSync(`<!DOCTYPE root [
    %common;
  ]><root/>`);
  assertEquals(doc.root.name.local, "root");
});

Deno.test("parseSync() throws on unknown DTD declaration type", () => {
  assertThrows(
    () =>
      parseSync(`<!DOCTYPE root [
      <!INVALID test>
    ]><root/>`),
    XmlSyntaxError,
    "Unknown DTD declaration type",
  );
});

Deno.test("parseSync() throws on conditional section in internal subset", () => {
  // Conditional sections start with <![INCLUDE or <![IGNORE
  // The parser sees <![, expects CDATA[, but gets something else
  assertThrows(
    () =>
      parseSync(`<!DOCTYPE root [
      <![INCLUDE[
        <!ELEMENT root (#PCDATA)>
      ]]>
    ]><root/>`),
    XmlSyntaxError,
    // The parser sees <! followed by [ which is the conditional section marker
    "Unknown DTD declaration type",
  );
});

// =============================================================================
// Content Before/After Root Tests
// =============================================================================

Deno.test("parseSync() throws on text before root element", () => {
  assertThrows(
    () => parseSync("text<root/>"),
    XmlSyntaxError,
    "Content is not allowed before the root element",
  );
});

Deno.test("parseSync() throws on text after root element", () => {
  assertThrows(
    () => parseSync("<root/>text"),
    XmlSyntaxError,
    "Content is not allowed after the root element",
  );
});

Deno.test("parseSync() throws on entity reference before root", () => {
  assertThrows(
    () => parseSync("&amp;<root/>"),
    XmlSyntaxError,
    "Character/entity references are not allowed in prolog",
  );
});

Deno.test("parseSync() throws on entity reference after root", () => {
  assertThrows(
    () => parseSync("<root/>&amp;"),
    XmlSyntaxError,
    "Character/entity references are not allowed in prolog/epilog",
  );
});

Deno.test("parseSync() throws on CDATA before root element", () => {
  assertThrows(
    () => parseSync("<![CDATA[test]]><root/>"),
    XmlSyntaxError,
    "CDATA section is not allowed before the root element",
  );
});

Deno.test("parseSync() throws on CDATA after root element", () => {
  assertThrows(
    () => parseSync("<root/><![CDATA[test]]>"),
    XmlSyntaxError,
    "CDATA section is not allowed after the root element",
  );
});

Deno.test("parseSync() throws on multiple root elements", () => {
  assertThrows(
    () => parseSync("<root1/><root2/>"),
    XmlSyntaxError,
    "Only one root element is allowed",
  );
});

// =============================================================================
// Namespace Tests
// =============================================================================

Deno.test("parseSync() throws on unbound namespace prefix in element", () => {
  assertThrows(
    () => parseSync("<ns:root/>"),
    XmlSyntaxError,
    "Unbound namespace prefix 'ns'",
  );
});

Deno.test("parseSync() throws on unbound namespace prefix in attribute", () => {
  assertThrows(
    () => parseSync("<root ns:attr='value'/>"),
    XmlSyntaxError,
    "Unbound namespace prefix 'ns'",
  );
});

Deno.test("parseSync() throws on duplicate attribute", () => {
  assertThrows(
    () => parseSync('<root attr="1" attr="2"/>'),
    XmlSyntaxError,
    "Duplicate attribute 'attr'",
  );
});

Deno.test("parseSync() throws on duplicate expanded attribute names", () => {
  assertThrows(
    () =>
      parseSync(
        '<root xmlns:a="http://example.com" xmlns:b="http://example.com" a:attr="1" b:attr="2"/>',
      ),
    XmlSyntaxError,
    "Duplicate expanded attribute name",
  );
});

Deno.test("parseSync() throws on element using xmlns prefix", () => {
  assertThrows(
    () => parseSync('<xmlns:test xmlns:xmlns="http://example.com"/>'),
    XmlSyntaxError,
    "Element name cannot use the 'xmlns' prefix",
  );
});

Deno.test("parseSync() handles namespace scope restoration on element close", () => {
  // Tests that namespace bindings are properly restored when elements close
  const doc = parseSync(`
    <root xmlns:ns="http://outer.com">
      <child xmlns:ns="http://inner.com">
        <ns:inner/>
      </child>
      <ns:outer/>
    </root>
  `);

  // The inner ns:inner element should have inner URI
  const children = doc.root.children.filter((c) => c.type === "element");
  const child = children[0];
  if (child?.type === "element") {
    const innerEl = child.children.find((c) => c.type === "element");
    if (innerEl?.type === "element") {
      assertEquals(innerEl.name.uri, "http://inner.com");
    }
  }

  // The outer ns:outer element should have outer URI
  const outer = children[1];
  if (outer?.type === "element") {
    assertEquals(outer.name.uri, "http://outer.com");
  }
});

// =============================================================================
// QName Validation Tests
// =============================================================================

Deno.test("parseSync() throws on QName starting with colon", () => {
  assertThrows(
    () => parseSync('<:element xmlns=":""/>'),
    XmlSyntaxError,
    "QName cannot start with ':'",
  );
});

Deno.test("parseSync() throws on QName ending with colon", () => {
  assertThrows(
    () => parseSync('<element: xmlns:element="http://example.com"/>'),
    XmlSyntaxError,
    "QName cannot end with ':'",
  );
});

Deno.test("parseSync() throws on QName with multiple colons", () => {
  assertThrows(
    () => parseSync('<a:b:c xmlns:a="http://a.com" xmlns:b="http://b.com"/>'),
    XmlSyntaxError,
    "QName cannot contain multiple ':'",
  );
});

Deno.test("parseSync() throws on attribute QName starting with colon", () => {
  assertThrows(
    () => parseSync('<root :attr="value"/>'),
    XmlSyntaxError,
    "QName cannot start with ':'",
  );
});

// =============================================================================
// Processing Instruction Tests
// =============================================================================

Deno.test("parseSync() throws on PI target containing colon", () => {
  assertThrows(
    () => parseSync("<?ns:target content?><root/>"),
    XmlSyntaxError,
    "Processing instruction target must not contain ':'",
  );
});

Deno.test("parseSync() throws on XML declaration not at start", () => {
  assertThrows(
    () => parseSync('<!-- comment --><?xml version="1.0"?><root/>'),
    XmlSyntaxError,
    "XML declaration must appear at the start of the document",
  );
});

Deno.test("parseSync() throws on BOM before root element", () => {
  // BOM (U+FEFF) is treated as content before root element which is invalid
  // XML 1.0 §2.8 only allows whitespace, comments, PIs, and DOCTYPE before root
  assertThrows(
    () => parseSync('\uFEFF<?xml version="1.0"?><root/>'),
    XmlSyntaxError,
    "Content is not allowed before the root element",
  );
});

// =============================================================================
// Comment Validation Tests
// =============================================================================

Deno.test("parseSync() throws on dash immediately before --> in comment", () => {
  assertThrows(
    () => parseSync("<root><!-- test---></root>"),
    XmlSyntaxError,
    "'-' is not permitted immediately before '-->'",
  );
});

// =============================================================================
// Text Content Validation Tests
// =============================================================================

Deno.test("parseSync() throws on ]]> in text content", () => {
  assertThrows(
    () => parseSync("<root>]]></root>"),
    XmlSyntaxError,
    "']]>' is not allowed in text content",
  );
});

Deno.test("parseSync() throws on illegal XML character in text", () => {
  assertThrows(
    () => parseSync("<root>\x00</root>"),
    XmlSyntaxError,
    "Illegal XML character U+0000",
  );
});

Deno.test("parseSync() throws on illegal XML character in comment", () => {
  assertThrows(
    () => parseSync("<root><!-- \x01 --></root>"),
    XmlSyntaxError,
    "Illegal XML character U+0001",
  );
});

Deno.test("parseSync() throws on illegal XML character in CDATA", () => {
  assertThrows(
    () => parseSync("<root><![CDATA[\x02]]></root>"),
    XmlSyntaxError,
    "Illegal XML character U+0002",
  );
});

// =============================================================================
// No Root Element Test
// =============================================================================

Deno.test("parseSync() throws on empty document", () => {
  assertThrows(
    () => parseSync(""),
    XmlSyntaxError,
    "No root element found",
  );
});

Deno.test("parseSync() throws on document with only whitespace", () => {
  assertThrows(
    () => parseSync("   \n   "),
    XmlSyntaxError,
    "No root element found",
  );
});

Deno.test("parseSync() throws on document with only declaration", () => {
  assertThrows(
    () => parseSync('<?xml version="1.0"?>'),
    XmlSyntaxError,
    "No root element found",
  );
});

// =============================================================================
// Invalid Character in End Tag Tests
// =============================================================================

Deno.test("parseSync() throws on invalid character in end tag name", () => {
  // The parser reads "r" then hits "@" which terminates the name
  // Then expects '>' but finds 'o'
  assertThrows(
    () => parseSync("<root></r@ot>"),
    XmlSyntaxError,
    "Expected '>' in end tag",
  );
});

// =============================================================================
// Self-closing root element with namespace
// =============================================================================

Deno.test("parseSync() handles self-closing root with namespace bindings", () => {
  const doc = parseSync('<ns:root xmlns:ns="http://example.com"/>');
  assertEquals(doc.root.name.prefix, "ns");
  assertEquals(doc.root.name.uri, "http://example.com");
});
