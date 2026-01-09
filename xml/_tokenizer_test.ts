// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertThrows } from "@std/assert";
import { type XmlToken, XmlTokenizer } from "./_tokenizer.ts";
import { XmlSyntaxError } from "./types.ts";

/** Helper to collect tokens from a string synchronously. */
function collectTokens(xml: string): XmlToken[] {
  const tokenizer = new XmlTokenizer();
  const tokens = tokenizer.process(xml);
  const remaining = tokenizer.finalize();
  return [...tokens, ...remaining];
}

/** Helper to collect tokens from multiple chunks (tests cross-chunk boundaries). */
function collectChunkedTokens(...chunks: string[]): XmlToken[] {
  const tokenizer = new XmlTokenizer();
  const tokens: XmlToken[] = [];
  for (const chunk of chunks) {
    tokens.push(...tokenizer.process(chunk));
  }
  tokens.push(...tokenizer.finalize());
  return tokens;
}

/** Type predicate for filtering tokens by type. */
function isTokenType<T extends XmlToken["type"]>(
  type: T,
): (token: XmlToken) => token is Extract<XmlToken, { type: T }> {
  return (token): token is Extract<XmlToken, { type: T }> =>
    token.type === type;
}

// =============================================================================
// Basic element tests
// =============================================================================

Deno.test("XmlTokenizer.process() handles simple element", () => {
  const tokens = collectTokens("<root></root>");
  assertEquals(tokens.length, 3);
  assertEquals(tokens[0]?.type, "start_tag_open");
  assertEquals((tokens[0] as { name: string }).name, "root");
  assertEquals(tokens[1]?.type, "start_tag_close");
  assertEquals(tokens[2]?.type, "end_tag");
  assertEquals((tokens[2] as { name: string }).name, "root");
});

Deno.test("XmlTokenizer.process() handles self-closing element", () => {
  const tokens = collectTokens("<item/>");
  assertEquals(tokens.length, 2);
  assertEquals(tokens[0]?.type, "start_tag_open");
  assertEquals((tokens[0] as { name: string }).name, "item");
  assertEquals(tokens[1]?.type, "start_tag_close");
  assertEquals((tokens[1] as { selfClosing: boolean }).selfClosing, true);
});

Deno.test("XmlTokenizer.process() handles self-closing element with space", () => {
  const tokens = collectTokens("<item />");
  assertEquals(tokens.length, 2);
  assertEquals(tokens[0]?.type, "start_tag_open");
  assertEquals(tokens[1]?.type, "start_tag_close");
  assertEquals((tokens[1] as { selfClosing: boolean }).selfClosing, true);
});

Deno.test("XmlTokenizer.process() handles nested elements", () => {
  const tokens = collectTokens("<a><b></b></a>");
  assertEquals(tokens.length, 6);
  assertEquals((tokens[0] as { name: string }).name, "a");
  assertEquals((tokens[2] as { name: string }).name, "b");
  assertEquals((tokens[4] as { name: string }).name, "b");
  assertEquals((tokens[5] as { name: string }).name, "a");
});

// =============================================================================
// Attribute tests
// =============================================================================

Deno.test("XmlTokenizer.process() handles single attribute", () => {
  const tokens = collectTokens('<item id="123"/>');
  assertEquals(tokens.length, 3);
  assertEquals(tokens[1]?.type, "attribute");
  assertEquals((tokens[1] as { name: string }).name, "id");
  assertEquals((tokens[1] as { value: string }).value, "123");
});

Deno.test("XmlTokenizer.process() handles multiple attributes", () => {
  const tokens = collectTokens('<item id="1" name="test"/>');
  const attrs = tokens.filter(isTokenType("attribute"));
  assertEquals(attrs.length, 2);
  assertEquals(attrs[0]?.name, "id");
  assertEquals(attrs[1]?.name, "name");
});

Deno.test("XmlTokenizer.process() handles single-quoted attributes", () => {
  const tokens = collectTokens("<item id='123'/>");
  const attr = tokens.find((t) => t.type === "attribute");
  assertEquals((attr as { value: string }).value, "123");
});

Deno.test("XmlTokenizer.process() handles attributes with entities", () => {
  const tokens = collectTokens('<item value="a&lt;b"/>');
  const attr = tokens.find((t) => t.type === "attribute");
  // Tokenizer does NOT decode entities - that's the parser's job
  assertEquals((attr as { value: string }).value, "a&lt;b");
});

Deno.test("XmlTokenizer.process() handles namespaced attributes", () => {
  const tokens = collectTokens('<item xml:lang="en"/>');
  const attr = tokens.find((t) => t.type === "attribute");
  assertEquals((attr as { name: string }).name, "xml:lang");
});

// =============================================================================
// Text content tests
// =============================================================================

Deno.test("XmlTokenizer.process() handles text content", () => {
  const tokens = collectTokens("<root>Hello World</root>");
  const text = tokens.find((t) => t.type === "text");
  assertEquals((text as { content: string }).content, "Hello World");
});

Deno.test("XmlTokenizer.process() handles text with entities", () => {
  const tokens = collectTokens("<root>&lt;test&gt;</root>");
  const text = tokens.find((t) => t.type === "text");
  // Tokenizer does NOT decode entities
  assertEquals((text as { content: string }).content, "&lt;test&gt;");
});

Deno.test("XmlTokenizer.process() handles multiple text nodes", () => {
  const tokens = collectTokens("<a>one<b/>two</a>");
  const texts = tokens.filter(isTokenType("text"));
  assertEquals(texts.length, 2);
  assertEquals(texts[0]?.content, "one");
  assertEquals(texts[1]?.content, "two");
});

// =============================================================================
// CDATA tests
// =============================================================================

Deno.test("XmlTokenizer.process() handles CDATA section", () => {
  const tokens = collectTokens("<root><![CDATA[<script>]]></root>");
  const cdata = tokens.find((t) => t.type === "cdata");
  assertEquals((cdata as { content: string }).content, "<script>");
});

Deno.test("XmlTokenizer.process() handles CDATA with special chars", () => {
  const tokens = collectTokens("<r><![CDATA[a & b < c]]></r>");
  const cdata = tokens.find((t) => t.type === "cdata");
  assertEquals((cdata as { content: string }).content, "a & b < c");
});

Deno.test("XmlTokenizer.process() handles CDATA with ]] inside", () => {
  const tokens = collectTokens("<r><![CDATA[a]]b]]></r>");
  const cdata = tokens.find((t) => t.type === "cdata");
  assertEquals((cdata as { content: string }).content, "a]]b");
});

// =============================================================================
// Comment tests
// =============================================================================

Deno.test("XmlTokenizer.process() handles comment", () => {
  const tokens = collectTokens("<root><!-- comment --></root>");
  const comment = tokens.find((t) => t.type === "comment");
  assertEquals((comment as { content: string }).content, " comment ");
});

Deno.test("XmlTokenizer.process() handles empty comment", () => {
  const tokens = collectTokens("<root><!----></root>");
  const comment = tokens.find((t) => t.type === "comment");
  assertEquals((comment as { content: string }).content, "");
});

Deno.test("XmlTokenizer.process() handles comment with dashes", () => {
  const tokens = collectTokens("<root><!-- a-b-c --></root>");
  const comment = tokens.find((t) => t.type === "comment");
  assertEquals((comment as { content: string }).content, " a-b-c ");
});

// =============================================================================
// Processing instruction tests
// =============================================================================

Deno.test("XmlTokenizer.process() handles processing instruction", () => {
  const tokens = collectTokens("<?php echo 'hi'; ?><root/>");
  const pi = tokens.find((t) => t.type === "processing_instruction");
  assertEquals((pi as { target: string }).target, "php");
  assertEquals((pi as { content: string }).content, "echo 'hi';");
});

Deno.test("XmlTokenizer.process() handles empty processing instruction", () => {
  const tokens = collectTokens("<?target?><root/>");
  const pi = tokens.find((t) => t.type === "processing_instruction");
  assertEquals((pi as { target: string }).target, "target");
  assertEquals((pi as { content: string }).content, "");
});

// =============================================================================
// XML declaration tests
// =============================================================================

Deno.test("XmlTokenizer.process() handles XML declaration", () => {
  const tokens = collectTokens('<?xml version="1.0"?><root/>');
  const decl = tokens.find((t) => t.type === "declaration");
  assertEquals((decl as { version: string }).version, "1.0");
});

Deno.test("XmlTokenizer.process() handles XML declaration with encoding", () => {
  const tokens = collectTokens(
    '<?xml version="1.0" encoding="UTF-8"?><root/>',
  );
  const decl = tokens.find((t) => t.type === "declaration");
  assertEquals((decl as { version: string }).version, "1.0");
  assertEquals((decl as { encoding?: string }).encoding, "UTF-8");
});

Deno.test("XmlTokenizer.process() handles XML declaration with standalone", () => {
  const tokens = collectTokens(
    '<?xml version="1.0" standalone="yes"?><root/>',
  );
  const decl = tokens.find((t) => t.type === "declaration");
  assertEquals((decl as { standalone?: string }).standalone, "yes");
});

Deno.test("XmlTokenizer.process() handles full XML declaration", () => {
  const tokens = collectTokens(
    '<?xml version="1.0" encoding="UTF-8" standalone="no"?><root/>',
  );
  const decl = tokens.find((t) => t.type === "declaration");
  assertEquals((decl as { version: string }).version, "1.0");
  assertEquals((decl as { encoding?: string }).encoding, "UTF-8");
  assertEquals((decl as { standalone?: string }).standalone, "no");
});

// =============================================================================
// Line ending normalization tests
// =============================================================================

Deno.test("XmlTokenizer.process() normalizes CRLF to LF", () => {
  const tokens = collectTokens("<root>a\r\nb</root>");
  const text = tokens.find((t) => t.type === "text");
  assertEquals((text as { content: string }).content, "a\nb");
});

Deno.test("XmlTokenizer.process() normalizes CR to LF", () => {
  const tokens = collectTokens("<root>a\rb</root>");
  const text = tokens.find((t) => t.type === "text");
  assertEquals((text as { content: string }).content, "a\nb");
});

// =============================================================================
// Position tracking tests
// =============================================================================

Deno.test("XmlTokenizer.process() tracks position correctly", () => {
  const tokens = collectTokens("<root>\n  <item/>\n</root>");
  const item = tokens.find(
    (t) =>
      t.type === "start_tag_open" && (t as { name: string }).name === "item",
  );
  assertEquals((item as { position: { line: number } }).position.line, 2);
  assertEquals((item as { position: { column: number } }).position.column, 3);
});

// =============================================================================
// Error handling tests
// =============================================================================

Deno.test("XmlTokenizer.process() throws on unexpected character in tag", () => {
  assertThrows(
    () => collectTokens("<root<>"),
    XmlSyntaxError,
  );
});

Deno.test("XmlTokenizer.process() throws on unclosed tag", () => {
  assertThrows(
    () => collectTokens("<root"),
    XmlSyntaxError,
    "Unexpected end of input",
  );
});

Deno.test("XmlTokenizer.process() throws on < in attribute value", () => {
  assertThrows(
    () => collectTokens('<root attr="<">'),
    XmlSyntaxError,
    "'<' not allowed in attribute value",
  );
});

// =============================================================================
// Namespace prefix tests
// =============================================================================

Deno.test("XmlTokenizer.process() handles namespaced element", () => {
  const tokens = collectTokens("<ns:root></ns:root>");
  assertEquals((tokens[0] as { name: string }).name, "ns:root");
  assertEquals((tokens[2] as { name: string }).name, "ns:root");
});

// =============================================================================
// Whitespace handling tests
// =============================================================================

Deno.test("XmlTokenizer.process() preserves whitespace in text", () => {
  const tokens = collectTokens("<root>  spaced  </root>");
  const text = tokens.find((t) => t.type === "text");
  assertEquals((text as { content: string }).content, "  spaced  ");
});

Deno.test("XmlTokenizer.process() handles whitespace-only text", () => {
  const tokens = collectTokens("<root>   </root>");
  const text = tokens.find((t) => t.type === "text");
  assertEquals((text as { content: string }).content, "   ");
});

// =============================================================================
// Edge case tests
// =============================================================================

Deno.test("XmlTokenizer.process() handles Unicode in element names", () => {
  const tokens = collectTokens("<日本語></日本語>");
  const open = tokens.find((t) => t.type === "start_tag_open");
  const end = tokens.find((t) => t.type === "end_tag");
  assertEquals((open as { name: string }).name, "日本語");
  assertEquals((end as { name: string }).name, "日本語");
});

Deno.test("XmlTokenizer.process() handles Unicode in attribute values", () => {
  const tokens = collectTokens('<item name="日本語"/>');
  const attr = tokens.find((t) => t.type === "attribute");
  assertEquals((attr as { value: string }).value, "日本語");
});

Deno.test("XmlTokenizer.process() handles deeply nested elements", () => {
  const tokens = collectTokens("<a><b><c><d></d></c></b></a>");
  const opens = tokens.filter(isTokenType("start_tag_open"));
  const ends = tokens.filter(isTokenType("end_tag"));
  assertEquals(opens.length, 4);
  assertEquals(ends.length, 4);
  assertEquals(opens[3]?.name, "d");
  assertEquals(ends[0]?.name, "d");
});

// =============================================================================
// Chunked input edge cases
// =============================================================================

Deno.test("XmlTokenizer.process() handles chunk boundary in tag name", () => {
  const tokens = collectChunkedTokens("<ro", "ot/>");
  const open = tokens.find((t) => t.type === "start_tag_open");
  assertEquals((open as { name: string }).name, "root");
});

Deno.test("XmlTokenizer.process() handles chunk boundary in attribute value", () => {
  const tokens = collectChunkedTokens('<item attr="val', 'ue"/>');
  const attr = tokens.find((t) => t.type === "attribute");
  assertEquals((attr as { value: string }).value, "value");
});

Deno.test("XmlTokenizer.process() handles chunk boundary in CDATA", () => {
  const tokens = collectChunkedTokens("<r><![CDA", "TA[content]]></r>");
  const cdata = tokens.find((t) => t.type === "cdata");
  assertEquals((cdata as { content: string }).content, "content");
});

Deno.test("XmlTokenizer.process() handles chunk boundary in comment", () => {
  const tokens = collectChunkedTokens("<r><!--com", "ment--></r>");
  const comment = tokens.find((t) => t.type === "comment");
  assertEquals((comment as { content: string }).content, "comment");
});

// =============================================================================
// DOCTYPE tests
// =============================================================================

Deno.test("XmlTokenizer.process() handles simple DOCTYPE", () => {
  const tokens = collectTokens("<!DOCTYPE html><html></html>");
  assertEquals(tokens[0]?.type, "doctype");
  assertEquals((tokens[0] as { name: string }).name, "html");
});

Deno.test("XmlTokenizer.process() handles DOCTYPE with PUBLIC identifier", () => {
  const tokens = collectTokens(
    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"><html></html>',
  );
  assertEquals(tokens[0]?.type, "doctype");
  const doctype = tokens[0] as {
    name: string;
    publicId?: string;
    systemId?: string;
  };
  assertEquals(doctype.name, "html");
  assertEquals(doctype.publicId, "-//W3C//DTD XHTML 1.0 Strict//EN");
  assertEquals(
    doctype.systemId,
    "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd",
  );
});

Deno.test("XmlTokenizer.process() handles DOCTYPE with SYSTEM identifier", () => {
  const tokens = collectTokens(
    '<!DOCTYPE greeting SYSTEM "hello.dtd"><greeting></greeting>',
  );
  assertEquals(tokens[0]?.type, "doctype");
  const doctype = tokens[0] as {
    name: string;
    publicId?: string;
    systemId?: string;
  };
  assertEquals(doctype.name, "greeting");
  assertEquals(doctype.publicId, undefined);
  assertEquals(doctype.systemId, "hello.dtd");
});

Deno.test("XmlTokenizer.process() handles DOCTYPE with internal subset", () => {
  const tokens = collectTokens(
    '<!DOCTYPE root [<!ELEMENT root (#PCDATA)><!ENTITY greeting "Hello">]><root></root>',
  );
  assertEquals(tokens[0]?.type, "doctype");
  assertEquals((tokens[0] as { name: string }).name, "root");
  // Internal subset is skipped, but DOCTYPE token is emitted
  assertEquals(tokens[1]?.type, "start_tag_open");
});

Deno.test("XmlTokenizer.process() handles DOCTYPE with nested brackets in internal subset", () => {
  const tokens = collectTokens(
    '<!DOCTYPE root [<!ENTITY foo "bar[baz]">]><root></root>',
  );
  assertEquals(tokens[0]?.type, "doctype");
  assertEquals((tokens[0] as { name: string }).name, "root");
});

Deno.test("XmlTokenizer.process() handles DOCTYPE with single-quoted identifiers", () => {
  const tokens = collectTokens(
    "<!DOCTYPE html PUBLIC '-//W3C//DTD HTML 4.01//EN' 'http://www.w3.org/TR/html4/strict.dtd'><html></html>",
  );
  assertEquals(tokens[0]?.type, "doctype");
  const doctype = tokens[0] as {
    name: string;
    publicId?: string;
    systemId?: string;
  };
  assertEquals(doctype.publicId, "-//W3C//DTD HTML 4.01//EN");
  assertEquals(doctype.systemId, "http://www.w3.org/TR/html4/strict.dtd");
});

Deno.test("XmlTokenizer.process() handles DOCTYPE position tracking", () => {
  const tokens = collectTokens("<!DOCTYPE html><html></html>");
  const doctype = tokens[0] as { position: { line: number; column: number } };
  assertEquals(doctype.position.line, 1);
  assertEquals(doctype.position.column, 1);
});

Deno.test("XmlTokenizer.process() handles DOCTYPE with whitespace", () => {
  const tokens = collectTokens(
    "<!DOCTYPE   html   ><html></html>",
  );
  assertEquals(tokens[0]?.type, "doctype");
  assertEquals((tokens[0] as { name: string }).name, "html");
});

Deno.test("XmlTokenizer.process() handles DOCTYPE before XML declaration position", () => {
  // XML declaration should come before DOCTYPE in valid documents,
  // but we test DOCTYPE-first to ensure position tracking works
  const tokens = collectTokens(
    '<?xml version="1.0"?><!DOCTYPE root><root></root>',
  );
  assertEquals(tokens[0]?.type, "declaration");
  assertEquals(tokens[1]?.type, "doctype");
});

// =============================================================================
// Self-closing tag chunk boundary tests (Issue #1 fix)
// =============================================================================

Deno.test("XmlTokenizer.process() handles self-closing tag with / and > in separate chunks", () => {
  const tokens = collectChunkedTokens("<item/", ">");
  assertEquals(tokens.length, 2);
  assertEquals(tokens[0]?.type, "start_tag_open");
  assertEquals((tokens[0] as { name: string }).name, "item");
  assertEquals(tokens[1]?.type, "start_tag_close");
  assertEquals((tokens[1] as { selfClosing: boolean }).selfClosing, true);
});

Deno.test("XmlTokenizer.process() handles self-closing tag with space, / and > in separate chunks", () => {
  const tokens = collectChunkedTokens("<item /", ">");
  assertEquals(tokens.length, 2);
  assertEquals(tokens[0]?.type, "start_tag_open");
  assertEquals(tokens[1]?.type, "start_tag_close");
  assertEquals((tokens[1] as { selfClosing: boolean }).selfClosing, true);
});

Deno.test("XmlTokenizer.process() handles self-closing tag with attributes and chunk boundary at /", () => {
  const tokens = collectChunkedTokens('<item id="123"/', ">");
  assertEquals(tokens.length, 3);
  assertEquals(tokens[0]?.type, "start_tag_open");
  assertEquals(tokens[1]?.type, "attribute");
  assertEquals(tokens[2]?.type, "start_tag_close");
  assertEquals((tokens[2] as { selfClosing: boolean }).selfClosing, true);
});

// =============================================================================
// Comment chunk boundary tests (Issue #2 fix)
// =============================================================================

Deno.test("XmlTokenizer.process() handles comment ending -- and > in separate chunks", () => {
  const tokens = collectChunkedTokens("<r><!-- hello --", "></r>");
  const comment = tokens.find((t) => t.type === "comment");
  assertEquals((comment as { content: string }).content, " hello ");
});

Deno.test("XmlTokenizer.process() handles comment ending - then - then > in separate chunks", () => {
  const tokens = collectChunkedTokens("<r><!-- hi -", "-", "></r>");
  const comment = tokens.find((t) => t.type === "comment");
  assertEquals((comment as { content: string }).content, " hi ");
});

Deno.test("XmlTokenizer.process() handles comment with single dash at chunk boundary", () => {
  const tokens = collectChunkedTokens("<r><!-- a-", "b --></r>");
  const comment = tokens.find((t) => t.type === "comment");
  assertEquals((comment as { content: string }).content, " a-b ");
});

Deno.test("XmlTokenizer.process() handles comment with -- inside (lenient)", () => {
  // Per XML 1.0 §2.5, '--' inside comments is invalid, but we're lenient
  const tokens = collectTokens("<r><!-- a--b --></r>");
  const comment = tokens.find((t) => t.type === "comment");
  assertEquals((comment as { content: string }).content, " a--b ");
});

Deno.test("XmlTokenizer.process() handles comment with --- inside (lenient)", () => {
  // "---" means first dash is content, then "--" for the end
  const tokens = collectTokens("<r><!-- test---></r>");
  const comment = tokens.find((t) => t.type === "comment");
  assertEquals((comment as { content: string }).content, " test-");
});

Deno.test("XmlTokenizer.process() handles comment with multiple dashes (lenient)", () => {
  const tokens = collectTokens("<r><!-- ---- --></r>");
  const comment = tokens.find((t) => t.type === "comment");
  // "----" is processed as: "-" (content), "-" (content), then "--" ends it
  // Wait, let's trace: "--" triggers COMMENT_DASH_DASH, then "-" adds one to content
  // and stays in COMMENT_DASH_DASH, then "-" adds one more and stays, then " " triggers
  // spec violation adding "--" to content... Actually let me re-think this.
  // With "---- -->":
  // 1. "-" -> COMMENT_DASH
  // 2. "-" -> COMMENT_DASH_DASH
  // 3. "-" -> add "-" to content, stay in COMMENT_DASH_DASH
  // 4. "-" -> add "-" to content, stay in COMMENT_DASH_DASH
  // 5. " " -> add "--" to content (lenient), go to COMMENT
  // So content = " " + "--" + "--" + " " = " ---- "? No wait...
  // Let me re-trace more carefully. Initial commentContent = ""
  // See first " " -> content = " "
  // See "-" -> COMMENT_DASH
  // See "-" -> COMMENT_DASH_DASH
  // See "-" -> content += "-", stay COMMENT_DASH_DASH. content = " -"
  // See "-" -> content += "-", stay COMMENT_DASH_DASH. content = " --"
  // See " " -> content += "--", content += " ", go to COMMENT. content = " ---- "
  // Then see "-" -> COMMENT_DASH
  // See "-" -> COMMENT_DASH_DASH
  // See ">" -> done. content = " ---- "
  assertEquals((comment as { content: string }).content, " ---- ");
});

// =============================================================================
// Additional error handling tests
// =============================================================================

Deno.test("XmlTokenizer.process() throws on invalid character in end tag name", () => {
  // & is not a valid name character
  assertThrows(
    () => collectTokens("<root></&>"),
    XmlSyntaxError,
    "Unexpected character",
  );
});

Deno.test("XmlTokenizer.process() throws on invalid character in DOCTYPE", () => {
  // & is not valid after <!DOCTYPE
  assertThrows(
    () => collectTokens("<!DOCTYPE &><root/>"),
    XmlSyntaxError,
    "Unexpected character",
  );
});

Deno.test("XmlTokenizer.process() throws on unclosed comment", () => {
  assertThrows(
    () => collectTokens("<root><!-- unclosed"),
    XmlSyntaxError,
    "Unterminated comment",
  );
});

Deno.test("XmlTokenizer.process() throws on unclosed CDATA", () => {
  assertThrows(
    () => collectTokens("<root><![CDATA[unclosed"),
    XmlSyntaxError,
    "Unterminated CDATA",
  );
});

Deno.test("XmlTokenizer.process() throws on unclosed attribute value", () => {
  assertThrows(
    () => collectTokens('<root attr="unclosed'),
    XmlSyntaxError,
    "Unterminated attribute value",
  );
});

Deno.test("XmlTokenizer.process() throws on invalid character after /", () => {
  assertThrows(
    () => collectTokens("<root/x>"),
    XmlSyntaxError,
    "Expected '>' after '/'",
  );
});

// =============================================================================
// XML declaration edge cases
// =============================================================================

Deno.test("XmlTokenizer.process() handles XML declaration with single quotes", () => {
  const tokens = collectTokens("<?xml version='1.0'?><root/>");
  const decl = tokens.find((t) => t.type === "declaration");
  assertEquals((decl as { version: string }).version, "1.0");
});

Deno.test("XmlTokenizer.process() handles XML declaration with mixed quotes", () => {
  const tokens = collectTokens(
    `<?xml version="1.0" encoding='UTF-8'?><root/>`,
  );
  const decl = tokens.find((t) => t.type === "declaration");
  assertEquals((decl as { version: string }).version, "1.0");
  assertEquals((decl as { encoding?: string }).encoding, "UTF-8");
});

Deno.test("XmlTokenizer.process() handles case-insensitive xml target", () => {
  // Per XML spec, "xml" target is case-insensitive for declarations
  const tokens = collectTokens('<?XML version="1.0"?><root/>');
  assertEquals(tokens[0]?.type, "declaration");
});

Deno.test("XmlTokenizer.process() handles mixed case xml target", () => {
  const tokens = collectTokens('<?xMl version="1.0"?><root/>');
  assertEquals(tokens[0]?.type, "declaration");
});

// =============================================================================
// DOCTYPE chunk boundary tests
// =============================================================================

Deno.test("XmlTokenizer.process() handles DOCTYPE with chunk boundary in name", () => {
  const tokens = collectChunkedTokens("<!DOCTYPE ht", "ml><html/>");
  assertEquals(tokens[0]?.type, "doctype");
  assertEquals((tokens[0] as { name: string }).name, "html");
});

Deno.test("XmlTokenizer.process() handles DOCTYPE with chunk boundary in PUBLIC keyword", () => {
  const tokens = collectChunkedTokens(
    "<!DOCTYPE html PUB",
    'LIC "-//W3C//DTD" "http://example.com"><html/>',
  );
  assertEquals(tokens[0]?.type, "doctype");
  assertEquals((tokens[0] as { publicId?: string }).publicId, "-//W3C//DTD");
});

// =============================================================================
// Position tracking edge cases
// =============================================================================

Deno.test("XmlTokenizer.process() tracks position correctly with CRLF", () => {
  const tokens = collectTokens("<root>\r\n  <item/>\r\n</root>");
  const item = tokens.find(
    (t) =>
      t.type === "start_tag_open" && (t as { name: string }).name === "item",
  );
  // After CRLF normalization, line 2 column 3
  assertEquals((item as { position: { line: number } }).position.line, 2);
  assertEquals((item as { position: { column: number } }).position.column, 3);
});

Deno.test("XmlTokenizer.process() tracks offset correctly", () => {
  const tokens = collectTokens("<a><b/></a>");
  const b = tokens.find(
    (t) => t.type === "start_tag_open" && (t as { name: string }).name === "b",
  );
  // <a> is 3 chars, so <b starts at offset 3
  assertEquals((b as { position: { offset: number } }).position.offset, 3);
});

// =============================================================================
// CDATA closing sequence chunk boundary tests (P0 fix)
// =============================================================================

Deno.test("XmlTokenizer.process() handles CDATA with ] and ]> in separate chunks", () => {
  const tokens = collectChunkedTokens("<r><![CDATA[foo]", "]></r>");
  const cdata = tokens.find((t) => t.type === "cdata");
  assertEquals((cdata as { content: string }).content, "foo");
});

Deno.test("XmlTokenizer.process() handles CDATA with ]] and > in separate chunks", () => {
  const tokens = collectChunkedTokens("<r><![CDATA[bar]]", "></r>");
  const cdata = tokens.find((t) => t.type === "cdata");
  assertEquals((cdata as { content: string }).content, "bar");
});

Deno.test("XmlTokenizer.process() handles CDATA with ] then ] then > in separate chunks", () => {
  const tokens = collectChunkedTokens("<r><![CDATA[baz]", "]", "></r>");
  const cdata = tokens.find((t) => t.type === "cdata");
  assertEquals((cdata as { content: string }).content, "baz");
});

Deno.test("XmlTokenizer.process() handles CDATA with ]]] sequence", () => {
  // First ] is content, then ]]> closes
  const tokens = collectTokens("<r><![CDATA[x]]]></r>");
  const cdata = tokens.find((t) => t.type === "cdata");
  assertEquals((cdata as { content: string }).content, "x]");
});

Deno.test("XmlTokenizer.process() handles CDATA with ]]] across chunks", () => {
  const tokens = collectChunkedTokens("<r><![CDATA[x]", "]]></r>");
  const cdata = tokens.find((t) => t.type === "cdata");
  assertEquals((cdata as { content: string }).content, "x]");
});

// =============================================================================
// PI closing sequence chunk boundary tests (P0 fix)
// =============================================================================

Deno.test("XmlTokenizer.process() handles PI with ? and > in separate chunks", () => {
  const tokens = collectChunkedTokens("<?php echo 'hi'; ?", "><root/>");
  const pi = tokens.find((t) => t.type === "processing_instruction");
  assertEquals((pi as { target: string }).target, "php");
  assertEquals((pi as { content: string }).content, "echo 'hi';");
});

Deno.test("XmlTokenizer.process() handles empty PI with ? and > in separate chunks", () => {
  const tokens = collectChunkedTokens("<?target?", "><root/>");
  const pi = tokens.find((t) => t.type === "processing_instruction");
  assertEquals((pi as { target: string }).target, "target");
  assertEquals((pi as { content: string }).content, "");
});

Deno.test("XmlTokenizer.process() handles PI with ?? in content", () => {
  const tokens = collectTokens("<?target is this a question???><root/>");
  const pi = tokens.find((t) => t.type === "processing_instruction");
  assertEquals((pi as { target: string }).target, "target");
  assertEquals((pi as { content: string }).content, "is this a question??");
});

Deno.test("XmlTokenizer.process() handles PI with ?? across chunk boundary", () => {
  const tokens = collectChunkedTokens("<?target a?", "?><root/>");
  const pi = tokens.find((t) => t.type === "processing_instruction");
  assertEquals((pi as { content: string }).content, "a?");
});

Deno.test("XmlTokenizer.process() handles XML declaration with ? and > in separate chunks", () => {
  const tokens = collectChunkedTokens(
    '<?xml version="1.0" encoding="UTF-8"?',
    "><root/>",
  );
  const decl = tokens.find((t) => t.type === "declaration");
  assertEquals((decl as { version: string }).version, "1.0");
  assertEquals((decl as { encoding?: string }).encoding, "UTF-8");
});

// =============================================================================
// Additional coverage: Attribute name with whitespace before =
// =============================================================================

Deno.test("XmlTokenizer.process() handles whitespace between attribute name and =", () => {
  const tokens = collectTokens('<item attr   =  "value"/>');
  const attrs = tokens.filter(isTokenType("attribute"));
  assertEquals(attrs.length, 1);
  assertEquals(attrs[0]?.name, "attr");
  assertEquals(attrs[0]?.value, "value");
});

Deno.test("XmlTokenizer.process() handles newlines between attribute name and =", () => {
  const tokens = collectTokens('<item attr\n\t=\n\t"value"/>');
  const attrs = tokens.filter(isTokenType("attribute"));
  assertEquals(attrs.length, 1);
  assertEquals(attrs[0]?.value, "value");
});

Deno.test("XmlTokenizer.process() throws when = missing after attribute name", () => {
  assertThrows(
    () => collectTokens('<item attr "value"/>'),
    XmlSyntaxError,
    "Expected '=' after attribute name",
  );
});

// =============================================================================
// Additional coverage: End tag with whitespace before >
// =============================================================================

Deno.test("XmlTokenizer.process() handles whitespace in end tag before >", () => {
  const tokens = collectTokens("<root></root   >");
  assertEquals(tokens.length, 3);
  assertEquals(tokens[2]?.type, "end_tag");
  assertEquals((tokens[2] as { name: string }).name, "root");
});

Deno.test("XmlTokenizer.process() handles newline in end tag before >", () => {
  const tokens = collectTokens("<root></root\n>");
  assertEquals(tokens.length, 3);
  assertEquals((tokens[2] as { name: string }).name, "root");
});

Deno.test("XmlTokenizer.process() throws on invalid character in end tag after name", () => {
  assertThrows(
    () => collectTokens("<root></root!>"),
    XmlSyntaxError,
    "Unexpected character",
  );
});

// =============================================================================
// Additional coverage: DOCTYPE edge cases
// =============================================================================

Deno.test("XmlTokenizer.process() handles DOCTYPE PUBLIC without system ID", () => {
  const tokens = collectTokens(
    '<!DOCTYPE html PUBLIC "-//W3C//DTD"><html></html>',
  );
  assertEquals(tokens[0]?.type, "doctype");
  const doctype = tokens[0] as {
    name: string;
    publicId?: string;
    systemId?: string;
  };
  assertEquals(doctype.name, "html");
  assertEquals(doctype.publicId, "-//W3C//DTD");
  assertEquals(doctype.systemId, undefined);
});

Deno.test("XmlTokenizer.process() throws on invalid keyword after DOCTYPE name", () => {
  assertThrows(
    () => collectTokens("<!DOCTYPE html INVALID><html/>"),
    XmlSyntaxError,
    "Unexpected character",
  );
});

Deno.test("XmlTokenizer.process() throws on missing quote after PUBLIC", () => {
  assertThrows(
    () => collectTokens("<!DOCTYPE html PUBLIC -//W3C//><html/>"),
    XmlSyntaxError,
    "Expected quote to start public ID",
  );
});

Deno.test("XmlTokenizer.process() throws on missing system ID quote after public ID", () => {
  assertThrows(
    () =>
      collectTokens(
        '<!DOCTYPE html PUBLIC "-//W3C//" system.dtd><html/>',
      ),
    XmlSyntaxError,
    "Expected system ID or '>'",
  );
});

Deno.test("XmlTokenizer.process() throws on invalid SYSTEM keyword", () => {
  assertThrows(
    () => collectTokens('<!DOCTYPE html SYSTE "test.dtd"><html/>'),
    XmlSyntaxError,
    "Expected SYSTEM",
  );
});

Deno.test("XmlTokenizer.process() throws on missing quote after SYSTEM", () => {
  assertThrows(
    () => collectTokens("<!DOCTYPE html SYSTEM test.dtd><html/>"),
    XmlSyntaxError,
    "Expected quote to start system ID",
  );
});

Deno.test("XmlTokenizer.process() throws on invalid PUBLIC keyword", () => {
  assertThrows(
    () => collectTokens('<!DOCTYPE html PUBLI "-//W3C//"><html/>'),
    XmlSyntaxError,
    "Expected PUBLIC",
  );
});

// =============================================================================
// Additional coverage: CDATA opening sequence error
// =============================================================================

Deno.test("XmlTokenizer.process() throws on invalid CDATA opening", () => {
  assertThrows(
    () => collectTokens("<root><![CDAT[content]]></root>"),
    XmlSyntaxError,
    "Expected 'CDATA[' after '<![",
  );
});

// =============================================================================
// Additional coverage: PI target edge cases
// =============================================================================

Deno.test("XmlTokenizer.process() throws on invalid character in PI target", () => {
  // & is not a valid name character
  assertThrows(
    () => collectTokens("<?&invalid?><root/>"),
    XmlSyntaxError,
    "Unexpected character",
  );
});

Deno.test("XmlTokenizer.process() throws on invalid character after ? in PI target", () => {
  assertThrows(
    () => collectTokens("<?target?x><root/>"),
    XmlSyntaxError,
    "Expected '>' after '?' in processing instruction",
  );
});

// =============================================================================
// Additional coverage: Comment start error
// =============================================================================

Deno.test("XmlTokenizer.process() throws on single dash after <!", () => {
  assertThrows(
    () => collectTokens("<root><!-x></root>"),
    XmlSyntaxError,
    "Expected '-' to start comment",
  );
});

// =============================================================================
// Additional coverage: PI content with ?> across chunks (PI_QUESTION state)
// =============================================================================

Deno.test("XmlTokenizer.process() handles PI content ending with ? then non-> char then ?>", () => {
  const tokens = collectTokens("<?target content?x?><root/>");
  const pi = tokens.find((t) => t.type === "processing_instruction");
  assertEquals((pi as { content: string }).content, "content?x");
});

// =============================================================================
// Additional coverage: XML declaration without version (defaults to 1.0)
// =============================================================================

Deno.test("XmlTokenizer.process() handles XML declaration without explicit version", () => {
  // Note: technically invalid XML but tokenizer is lenient
  const tokens = collectTokens('<?xml encoding="UTF-8"?><root/>');
  const decl = tokens.find((t) => t.type === "declaration");
  assertEquals((decl as { version: string }).version, "1.0"); // default
  assertEquals((decl as { encoding?: string }).encoding, "UTF-8");
});

Deno.test("XmlTokenizer.process() handles XML declaration with only standalone", () => {
  const tokens = collectTokens('<?xml standalone="yes"?><root/>');
  const decl = tokens.find((t) => t.type === "declaration");
  assertEquals((decl as { standalone?: string }).standalone, "yes");
});

// =============================================================================
// Additional coverage: Simple error cases
// =============================================================================

Deno.test("XmlTokenizer.process() throws on invalid character after <", () => {
  assertThrows(
    () => collectTokens("<@root/>"),
    XmlSyntaxError,
    "Unexpected character",
  );
});

Deno.test("XmlTokenizer.process() throws on < in single-quoted attribute value", () => {
  assertThrows(
    () => collectTokens("<root attr='<'/>"),
    XmlSyntaxError,
    "'<' not allowed in attribute value",
  );
});

Deno.test("XmlTokenizer.process() throws on unsupported markup declaration", () => {
  assertThrows(
    () => collectTokens("<root><!X></root>"),
    XmlSyntaxError,
    "Unsupported markup declaration",
  );
});

Deno.test("XmlTokenizer.process() handles DOCTYPE with internal subset directly after name", () => {
  const tokens = collectTokens(
    "<!DOCTYPE root[<!ELEMENT root ANY>]><root/>",
  );
  assertEquals(tokens[0]?.type, "doctype");
  assertEquals((tokens[0] as { name: string }).name, "root");
});

Deno.test("XmlTokenizer.process() handles DOCTYPE internal subset with nested brackets", () => {
  const tokens = collectTokens(
    '<!DOCTYPE root [<!ENTITY x "[">]><root/>',
  );
  assertEquals(tokens[0]?.type, "doctype");
});

// =============================================================================
// Coverage: Error paths
// =============================================================================

Deno.test("XmlTokenizer.process() throws on invalid character after tag name", () => {
  assertThrows(
    () => collectTokens("<item @/>"),
    XmlSyntaxError,
    "Unexpected character",
  );
});

Deno.test("XmlTokenizer.process() throws on invalid character in attribute name", () => {
  assertThrows(
    () => collectTokens('<item attr@="value"/>'),
    XmlSyntaxError,
    "Unexpected character",
  );
});

Deno.test("XmlTokenizer.process() throws on invalid character in end tag after whitespace", () => {
  assertThrows(
    () => collectTokens("<root></root @>"),
    XmlSyntaxError,
    "Unexpected character",
  );
});

Deno.test("XmlTokenizer.process() throws on invalid DOCTYPE keyword", () => {
  assertThrows(
    () => collectTokens("<!DOCTYP html><root/>"),
    XmlSyntaxError,
    "Expected DOCTYPE",
  );
});

// =============================================================================
// DOCTYPE internal subset nested brackets
// =============================================================================

Deno.test("XmlTokenizer.process() handles DOCTYPE internal subset with actual nested brackets", () => {
  // This tests nested [ inside internal subset
  // The nested [ must be outside of quotes to hit the bracket tracking code
  const tokens = collectTokens(
    "<!DOCTYPE root [<!ATTLIST x y CDATA #IMPLIED>]><root/>",
  );
  assertEquals(tokens[0]?.type, "doctype");
  assertEquals((tokens[0] as { name: string }).name, "root");
});

Deno.test("XmlTokenizer.process() handles DOCTYPE internal subset with nested conditional sections", () => {
  // DOCTYPE with INCLUDE conditional section creates nested brackets
  const tokens = collectTokens(
    "<!DOCTYPE root [<![INCLUDE[<!ELEMENT root ANY>]]>]><root/>",
  );
  assertEquals(tokens[0]?.type, "doctype");
});

// =============================================================================
// DOCTYPE internal subset edge cases
// =============================================================================

Deno.test("XmlTokenizer.process() handles DOCTYPE internal subset with deeply nested brackets", () => {
  const tokens = collectTokens(
    '<!DOCTYPE root [<!ENTITY x "["><!ENTITY y "[">]><root/>',
  );
  assertEquals(tokens[0]?.type, "doctype");
});

// =============================================================================
// CDATA edge cases
// =============================================================================

Deno.test("XmlTokenizer.process() handles CDATA with single ] in content", () => {
  const tokens = collectTokens("<r><![CDATA[a]b]]></r>");
  const cdata = tokens.find((t) => t.type === "cdata");
  assertEquals((cdata as { content: string }).content, "a]b");
});

// =============================================================================
// XML declaration edge cases
// =============================================================================

Deno.test("XmlTokenizer.process() handles empty XML declaration", () => {
  const tokens = collectTokens("<?xml?><root/>");
  const decl = tokens.find((t) => t.type === "declaration");
  assertEquals((decl as { version: string }).version, "1.0");
});

Deno.test("XmlTokenizer.process() handles XML declaration with single-quoted standalone", () => {
  const tokens = collectTokens(
    "<?xml version='1.0' standalone='no'?><root/>",
  );
  const decl = tokens.find((t) => t.type === "declaration");
  assertEquals((decl as { standalone?: string }).standalone, "no");
});

// =============================================================================
// Empty processing instruction (PI_TARGET_QUESTION state)
// =============================================================================

Deno.test("XmlTokenizer.process() handles empty processing instruction (no content)", () => {
  // Tests PI_TARGET_QUESTION state
  const tokens = collectTokens("<root><?target?></root>");
  const pi = tokens.find((t) => t.type === "processing_instruction");
  assertEquals((pi as { target: string }).target, "target");
  assertEquals((pi as { content: string }).content, "");
});

// =============================================================================
// Simple DOCTYPE without external IDs
// =============================================================================

Deno.test("XmlTokenizer.process() handles simple DOCTYPE without external IDs", () => {
  // Tests DOCTYPE_NAME → > path
  const tokens = collectTokens("<!DOCTYPE html><root/>");
  const doctype = tokens.find((t) => t.type === "doctype");
  assertEquals((doctype as { name: string }).name, "html");
  assertEquals((doctype as { publicId?: string }).publicId, undefined);
  assertEquals((doctype as { systemId?: string }).systemId, undefined);
});

// =============================================================================
// CDATA with multiple closing brackets
// =============================================================================

Deno.test("XmlTokenizer.process() handles CDATA ending with ]]]>", () => {
  // Tests CDATA_BRACKET_BRACKET when c === ']'
  const tokens = collectTokens("<r><![CDATA[text]]]></r>");
  const cdata = tokens.find((t) => t.type === "cdata");
  assertEquals((cdata as { content: string }).content, "text]");
});

Deno.test("XmlTokenizer.process() handles CDATA with ]]]] sequence", () => {
  // Tests multiple ] in CDATA_BRACKET_BRACKET state
  const tokens = collectTokens("<r><![CDATA[a]]]]></r>");
  const cdata = tokens.find((t) => t.type === "cdata");
  assertEquals((cdata as { content: string }).content, "a]]");
});

// =============================================================================
// Processing instruction with content containing ?
// =============================================================================

Deno.test("XmlTokenizer.process() handles PI with ? followed by non-> in content", () => {
  // Tests PI_QUESTION when c !== '>' and c !== '?'
  const tokens = collectTokens("<root><?target a?b?></root>");
  const pi = tokens.find((t) => t.type === "processing_instruction");
  assertEquals((pi as { target: string }).target, "target");
  assertEquals((pi as { content: string }).content, "a?b");
});

// =============================================================================
// Processing instruction content split across chunks
// =============================================================================

Deno.test("XmlTokenizer.process() handles PI content split across chunks", () => {
  // Tests PI content accumulation across chunk boundaries
  const tokens = collectChunkedTokens("<root><?pi cont", "ent?></root>");
  const pi = tokens.find((t) => t.type === "processing_instruction");
  assertEquals((pi as { target: string }).target, "pi");
  assertEquals((pi as { content: string }).content, "content");
});

Deno.test("XmlTokenizer.process() handles PI target split across chunks", () => {
  // Tests savePartialsBeforeReset for PI target
  const tokens = collectChunkedTokens("<root><?tar", "get data?></root>");
  const pi = tokens.find((t) => t.type === "processing_instruction");
  assertEquals((pi as { target: string }).target, "target");
  assertEquals((pi as { content: string }).content, "data");
});

// =============================================================================
// Comment split across chunks
// =============================================================================

Deno.test("XmlTokenizer.process() handles comment content split across chunks", () => {
  // Tests comment content accumulation across chunk boundaries
  const tokens = collectChunkedTokens("<root><!-- comm", "ent --></root>");
  const comment = tokens.find((t) => t.type === "comment");
  assertEquals((comment as { content: string }).content, " comment ");
});

// =============================================================================
// Finalize error path tests
// =============================================================================

Deno.test("XmlTokenizer.finalize() throws for input ending with <", () => {
  const tokenizer = new XmlTokenizer();
  tokenizer.process("<");
  assertThrows(
    () => tokenizer.finalize(),
    XmlSyntaxError,
    "Unexpected end of input after '<'",
  );
});

Deno.test("XmlTokenizer.finalize() throws for unclosed end tag name", () => {
  const tokenizer = new XmlTokenizer();
  tokenizer.process("<root></roo");
  assertThrows(
    () => tokenizer.finalize(),
    XmlSyntaxError,
    "Unexpected end of input in end tag",
  );
});

Deno.test("XmlTokenizer.finalize() throws for unclosed end tag after name", () => {
  const tokenizer = new XmlTokenizer();
  tokenizer.process("<root></root ");
  assertThrows(
    () => tokenizer.finalize(),
    XmlSyntaxError,
    "Unexpected end of input in end tag",
  );
});

Deno.test("XmlTokenizer.finalize() throws for unclosed PI target", () => {
  const tokenizer = new XmlTokenizer();
  tokenizer.process("<?target");
  assertThrows(
    () => tokenizer.finalize(),
    XmlSyntaxError,
    "Unterminated processing instruction",
  );
});

Deno.test("XmlTokenizer.finalize() throws for unclosed PI content", () => {
  const tokenizer = new XmlTokenizer();
  tokenizer.process("<?target content");
  assertThrows(
    () => tokenizer.finalize(),
    XmlSyntaxError,
    "Unterminated processing instruction",
  );
});

Deno.test("XmlTokenizer.finalize() throws for incomplete markup declaration", () => {
  const tokenizer = new XmlTokenizer();
  tokenizer.process("<!");
  assertThrows(
    () => tokenizer.finalize(),
    XmlSyntaxError,
    "Unexpected end of input in markup declaration",
  );
});

Deno.test("XmlTokenizer.finalize() throws for unclosed DOCTYPE", () => {
  const tokenizer = new XmlTokenizer();
  tokenizer.process("<!DOCTYPE html");
  assertThrows(
    () => tokenizer.finalize(),
    XmlSyntaxError,
    "Unterminated DOCTYPE",
  );
});

Deno.test("XmlTokenizer.finalize() throws for truncated DOCTYPE keyword", () => {
  // Tests DOCTYPE_START state - input ends mid-keyword like "<!DOCTY"
  const tokenizer = new XmlTokenizer();
  tokenizer.process("<!DOCTY");
  assertThrows(
    () => tokenizer.finalize(),
    XmlSyntaxError,
    "Unterminated DOCTYPE",
  );
});

Deno.test("XmlTokenizer.finalize() throws for unclosed DOCTYPE PUBLIC", () => {
  const tokenizer = new XmlTokenizer();
  tokenizer.process("<!DOCTYPE html PUB");
  assertThrows(
    () => tokenizer.finalize(),
    XmlSyntaxError,
    "Unterminated DOCTYPE",
  );
});

Deno.test("XmlTokenizer.finalize() throws for unclosed DOCTYPE internal subset", () => {
  const tokenizer = new XmlTokenizer();
  tokenizer.process("<!DOCTYPE html [<!ELEMENT root EMPTY>");
  assertThrows(
    () => tokenizer.finalize(),
    XmlSyntaxError,
    "Unterminated DOCTYPE",
  );
});
