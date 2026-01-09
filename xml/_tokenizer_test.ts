// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertRejects } from "@std/assert";
import { tokenize, type XmlToken } from "./_tokenizer.ts";
import { XmlSyntaxError } from "./types.ts";

/** Helper to collect tokens from a string (flattens batches). */
async function collectTokens(xml: string): Promise<XmlToken[]> {
  const tokens: XmlToken[] = [];
  for await (const batch of tokenize(toAsyncIterable(xml))) {
    tokens.push(...batch);
  }
  return tokens;
}

/** Convert string to async iterable. */
async function* toAsyncIterable(s: string): AsyncIterable<string> {
  yield s;
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

Deno.test("tokenize() handles simple element", async () => {
  const tokens = await collectTokens("<root></root>");
  assertEquals(tokens.length, 3);
  assertEquals(tokens[0]?.type, "start_tag_open");
  assertEquals((tokens[0] as { name: string }).name, "root");
  assertEquals(tokens[1]?.type, "start_tag_close");
  assertEquals(tokens[2]?.type, "end_tag");
  assertEquals((tokens[2] as { name: string }).name, "root");
});

Deno.test("tokenize() handles self-closing element", async () => {
  const tokens = await collectTokens("<item/>");
  assertEquals(tokens.length, 2);
  assertEquals(tokens[0]?.type, "start_tag_open");
  assertEquals((tokens[0] as { name: string }).name, "item");
  assertEquals(tokens[1]?.type, "start_tag_close");
  assertEquals((tokens[1] as { selfClosing: boolean }).selfClosing, true);
});

Deno.test("tokenize() handles self-closing element with space", async () => {
  const tokens = await collectTokens("<item />");
  assertEquals(tokens.length, 2);
  assertEquals(tokens[0]?.type, "start_tag_open");
  assertEquals(tokens[1]?.type, "start_tag_close");
  assertEquals((tokens[1] as { selfClosing: boolean }).selfClosing, true);
});

Deno.test("tokenize() handles nested elements", async () => {
  const tokens = await collectTokens("<a><b></b></a>");
  assertEquals(tokens.length, 6);
  assertEquals((tokens[0] as { name: string }).name, "a");
  assertEquals((tokens[2] as { name: string }).name, "b");
  assertEquals((tokens[4] as { name: string }).name, "b");
  assertEquals((tokens[5] as { name: string }).name, "a");
});

// =============================================================================
// Attribute tests
// =============================================================================

Deno.test("tokenize() handles single attribute", async () => {
  const tokens = await collectTokens('<item id="123"/>');
  assertEquals(tokens.length, 3);
  assertEquals(tokens[1]?.type, "attribute");
  assertEquals((tokens[1] as { name: string }).name, "id");
  assertEquals((tokens[1] as { value: string }).value, "123");
});

Deno.test("tokenize() handles multiple attributes", async () => {
  const tokens = await collectTokens('<item id="1" name="test"/>');
  const attrs = tokens.filter(isTokenType("attribute"));
  assertEquals(attrs.length, 2);
  assertEquals(attrs[0]?.name, "id");
  assertEquals(attrs[1]?.name, "name");
});

Deno.test("tokenize() handles single-quoted attributes", async () => {
  const tokens = await collectTokens("<item id='123'/>");
  const attr = tokens.find((t) => t.type === "attribute");
  assertEquals((attr as { value: string }).value, "123");
});

Deno.test("tokenize() handles attributes with entities", async () => {
  const tokens = await collectTokens('<item value="a&lt;b"/>');
  const attr = tokens.find((t) => t.type === "attribute");
  // Tokenizer does NOT decode entities - that's the parser's job
  assertEquals((attr as { value: string }).value, "a&lt;b");
});

Deno.test("tokenize() handles namespaced attributes", async () => {
  const tokens = await collectTokens('<item xml:lang="en"/>');
  const attr = tokens.find((t) => t.type === "attribute");
  assertEquals((attr as { name: string }).name, "xml:lang");
});

// =============================================================================
// Text content tests
// =============================================================================

Deno.test("tokenize() handles text content", async () => {
  const tokens = await collectTokens("<root>Hello World</root>");
  const text = tokens.find((t) => t.type === "text");
  assertEquals((text as { content: string }).content, "Hello World");
});

Deno.test("tokenize() handles text with entities", async () => {
  const tokens = await collectTokens("<root>&lt;test&gt;</root>");
  const text = tokens.find((t) => t.type === "text");
  // Tokenizer does NOT decode entities
  assertEquals((text as { content: string }).content, "&lt;test&gt;");
});

Deno.test("tokenize() handles multiple text nodes", async () => {
  const tokens = await collectTokens("<a>one<b/>two</a>");
  const texts = tokens.filter(isTokenType("text"));
  assertEquals(texts.length, 2);
  assertEquals(texts[0]?.content, "one");
  assertEquals(texts[1]?.content, "two");
});

// =============================================================================
// CDATA tests
// =============================================================================

Deno.test("tokenize() handles CDATA section", async () => {
  const tokens = await collectTokens("<root><![CDATA[<script>]]></root>");
  const cdata = tokens.find((t) => t.type === "cdata");
  assertEquals((cdata as { content: string }).content, "<script>");
});

Deno.test("tokenize() handles CDATA with special chars", async () => {
  const tokens = await collectTokens("<r><![CDATA[a & b < c]]></r>");
  const cdata = tokens.find((t) => t.type === "cdata");
  assertEquals((cdata as { content: string }).content, "a & b < c");
});

Deno.test("tokenize() handles CDATA with ]] inside", async () => {
  const tokens = await collectTokens("<r><![CDATA[a]]b]]></r>");
  const cdata = tokens.find((t) => t.type === "cdata");
  assertEquals((cdata as { content: string }).content, "a]]b");
});

// =============================================================================
// Comment tests
// =============================================================================

Deno.test("tokenize() handles comment", async () => {
  const tokens = await collectTokens("<root><!-- comment --></root>");
  const comment = tokens.find((t) => t.type === "comment");
  assertEquals((comment as { content: string }).content, " comment ");
});

Deno.test("tokenize() handles empty comment", async () => {
  const tokens = await collectTokens("<root><!----></root>");
  const comment = tokens.find((t) => t.type === "comment");
  assertEquals((comment as { content: string }).content, "");
});

Deno.test("tokenize() handles comment with dashes", async () => {
  const tokens = await collectTokens("<root><!-- a-b-c --></root>");
  const comment = tokens.find((t) => t.type === "comment");
  assertEquals((comment as { content: string }).content, " a-b-c ");
});

// =============================================================================
// Processing instruction tests
// =============================================================================

Deno.test("tokenize() handles processing instruction", async () => {
  const tokens = await collectTokens("<?php echo 'hi'; ?><root/>");
  const pi = tokens.find((t) => t.type === "processing_instruction");
  assertEquals((pi as { target: string }).target, "php");
  assertEquals((pi as { content: string }).content, "echo 'hi';");
});

Deno.test("tokenize() handles empty processing instruction", async () => {
  const tokens = await collectTokens("<?target?><root/>");
  const pi = tokens.find((t) => t.type === "processing_instruction");
  assertEquals((pi as { target: string }).target, "target");
  assertEquals((pi as { content: string }).content, "");
});

// =============================================================================
// XML declaration tests
// =============================================================================

Deno.test("tokenize() handles XML declaration", async () => {
  const tokens = await collectTokens('<?xml version="1.0"?><root/>');
  const decl = tokens.find((t) => t.type === "declaration");
  assertEquals((decl as { version: string }).version, "1.0");
});

Deno.test("tokenize() handles XML declaration with encoding", async () => {
  const tokens = await collectTokens(
    '<?xml version="1.0" encoding="UTF-8"?><root/>',
  );
  const decl = tokens.find((t) => t.type === "declaration");
  assertEquals((decl as { version: string }).version, "1.0");
  assertEquals((decl as { encoding?: string }).encoding, "UTF-8");
});

Deno.test("tokenize() handles XML declaration with standalone", async () => {
  const tokens = await collectTokens(
    '<?xml version="1.0" standalone="yes"?><root/>',
  );
  const decl = tokens.find((t) => t.type === "declaration");
  assertEquals((decl as { standalone?: string }).standalone, "yes");
});

Deno.test("tokenize() handles full XML declaration", async () => {
  const tokens = await collectTokens(
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

Deno.test("tokenize() normalizes CRLF to LF", async () => {
  const tokens = await collectTokens("<root>a\r\nb</root>");
  const text = tokens.find((t) => t.type === "text");
  assertEquals((text as { content: string }).content, "a\nb");
});

Deno.test("tokenize() normalizes CR to LF", async () => {
  const tokens = await collectTokens("<root>a\rb</root>");
  const text = tokens.find((t) => t.type === "text");
  assertEquals((text as { content: string }).content, "a\nb");
});

// =============================================================================
// Position tracking tests
// =============================================================================

Deno.test("tokenize() tracks position correctly", async () => {
  const tokens = await collectTokens("<root>\n  <item/>\n</root>");
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

Deno.test("tokenize() throws on unexpected character in tag", async () => {
  await assertRejects(
    async () => await collectTokens("<root<>"),
    XmlSyntaxError,
  );
});

Deno.test("tokenize() throws on unclosed tag", async () => {
  await assertRejects(
    async () => await collectTokens("<root"),
    XmlSyntaxError,
    "Unexpected end of input",
  );
});

Deno.test("tokenize() throws on < in attribute value", async () => {
  await assertRejects(
    async () => await collectTokens('<root attr="<">'),
    XmlSyntaxError,
    "'<' not allowed in attribute value",
  );
});

// =============================================================================
// Namespace prefix tests
// =============================================================================

Deno.test("tokenize() handles namespaced element", async () => {
  const tokens = await collectTokens("<ns:root></ns:root>");
  assertEquals((tokens[0] as { name: string }).name, "ns:root");
  assertEquals((tokens[2] as { name: string }).name, "ns:root");
});

// =============================================================================
// Whitespace handling tests
// =============================================================================

Deno.test("tokenize() preserves whitespace in text", async () => {
  const tokens = await collectTokens("<root>  spaced  </root>");
  const text = tokens.find((t) => t.type === "text");
  assertEquals((text as { content: string }).content, "  spaced  ");
});

Deno.test("tokenize() handles whitespace-only text", async () => {
  const tokens = await collectTokens("<root>   </root>");
  const text = tokens.find((t) => t.type === "text");
  assertEquals((text as { content: string }).content, "   ");
});

// =============================================================================
// Edge case tests
// =============================================================================

Deno.test("tokenize() handles Unicode in element names", async () => {
  const tokens = await collectTokens("<日本語></日本語>");
  const open = tokens.find((t) => t.type === "start_tag_open");
  const end = tokens.find((t) => t.type === "end_tag");
  assertEquals((open as { name: string }).name, "日本語");
  assertEquals((end as { name: string }).name, "日本語");
});

Deno.test("tokenize() handles Unicode in attribute values", async () => {
  const tokens = await collectTokens('<item name="日本語"/>');
  const attr = tokens.find((t) => t.type === "attribute");
  assertEquals((attr as { value: string }).value, "日本語");
});

Deno.test("tokenize() handles deeply nested elements", async () => {
  const tokens = await collectTokens("<a><b><c><d></d></c></b></a>");
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

Deno.test("tokenize() handles chunk boundary in tag name", async () => {
  const tokens: XmlToken[] = [];
  async function* chunks(): AsyncIterable<string> {
    yield "<ro";
    yield "ot/>";
  }
  for await (const batch of tokenize(chunks())) {
    tokens.push(...batch);
  }
  const open = tokens.find((t) => t.type === "start_tag_open");
  assertEquals((open as { name: string }).name, "root");
});

Deno.test("tokenize() handles chunk boundary in attribute value", async () => {
  const tokens: XmlToken[] = [];
  async function* chunks(): AsyncIterable<string> {
    yield '<item attr="val';
    yield 'ue"/>';
  }
  for await (const batch of tokenize(chunks())) {
    tokens.push(...batch);
  }
  const attr = tokens.find((t) => t.type === "attribute");
  assertEquals((attr as { value: string }).value, "value");
});

Deno.test("tokenize() handles chunk boundary in CDATA", async () => {
  const tokens: XmlToken[] = [];
  async function* chunks(): AsyncIterable<string> {
    yield "<r><![CDA";
    yield "TA[content]]></r>";
  }
  for await (const batch of tokenize(chunks())) {
    tokens.push(...batch);
  }
  const cdata = tokens.find((t) => t.type === "cdata");
  assertEquals((cdata as { content: string }).content, "content");
});

Deno.test("tokenize() handles chunk boundary in comment", async () => {
  const tokens: XmlToken[] = [];
  async function* chunks(): AsyncIterable<string> {
    yield "<r><!--com";
    yield "ment--></r>";
  }
  for await (const batch of tokenize(chunks())) {
    tokens.push(...batch);
  }
  const comment = tokens.find((t) => t.type === "comment");
  assertEquals((comment as { content: string }).content, "comment");
});

// =============================================================================
// DOCTYPE tests
// =============================================================================

Deno.test("tokenize() handles simple DOCTYPE", async () => {
  const tokens = await collectTokens("<!DOCTYPE html><html></html>");
  assertEquals(tokens[0]?.type, "doctype");
  assertEquals((tokens[0] as { name: string }).name, "html");
});

Deno.test("tokenize() handles DOCTYPE with PUBLIC identifier", async () => {
  const tokens = await collectTokens(
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

Deno.test("tokenize() handles DOCTYPE with SYSTEM identifier", async () => {
  const tokens = await collectTokens(
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

Deno.test("tokenize() handles DOCTYPE with internal subset", async () => {
  const tokens = await collectTokens(
    '<!DOCTYPE root [<!ELEMENT root (#PCDATA)><!ENTITY greeting "Hello">]><root></root>',
  );
  assertEquals(tokens[0]?.type, "doctype");
  assertEquals((tokens[0] as { name: string }).name, "root");
  // Internal subset is skipped, but DOCTYPE token is emitted
  assertEquals(tokens[1]?.type, "start_tag_open");
});

Deno.test("tokenize() handles DOCTYPE with nested brackets in internal subset", async () => {
  const tokens = await collectTokens(
    '<!DOCTYPE root [<!ENTITY foo "bar[baz]">]><root></root>',
  );
  assertEquals(tokens[0]?.type, "doctype");
  assertEquals((tokens[0] as { name: string }).name, "root");
});

Deno.test("tokenize() handles DOCTYPE with single-quoted identifiers", async () => {
  const tokens = await collectTokens(
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

Deno.test("tokenize() handles DOCTYPE position tracking", async () => {
  const tokens = await collectTokens("<!DOCTYPE html><html></html>");
  const doctype = tokens[0] as { position: { line: number; column: number } };
  assertEquals(doctype.position.line, 1);
  assertEquals(doctype.position.column, 1);
});

Deno.test("tokenize() handles DOCTYPE with whitespace", async () => {
  const tokens = await collectTokens(
    "<!DOCTYPE   html   ><html></html>",
  );
  assertEquals(tokens[0]?.type, "doctype");
  assertEquals((tokens[0] as { name: string }).name, "html");
});

Deno.test("tokenize() handles DOCTYPE before XML declaration position", async () => {
  // XML declaration should come before DOCTYPE in valid documents,
  // but we test DOCTYPE-first to ensure position tracking works
  const tokens = await collectTokens(
    '<?xml version="1.0"?><!DOCTYPE root><root></root>',
  );
  assertEquals(tokens[0]?.type, "declaration");
  assertEquals(tokens[1]?.type, "doctype");
});

// =============================================================================
// Self-closing tag chunk boundary tests (Issue #1 fix)
// =============================================================================

Deno.test("tokenize() handles self-closing tag with / and > in separate chunks", async () => {
  const tokens: XmlToken[] = [];
  async function* chunks(): AsyncIterable<string> {
    yield "<item/";
    yield ">";
  }
  for await (const batch of tokenize(chunks())) {
    tokens.push(...batch);
  }
  assertEquals(tokens.length, 2);
  assertEquals(tokens[0]?.type, "start_tag_open");
  assertEquals((tokens[0] as { name: string }).name, "item");
  assertEquals(tokens[1]?.type, "start_tag_close");
  assertEquals((tokens[1] as { selfClosing: boolean }).selfClosing, true);
});

Deno.test("tokenize() handles self-closing tag with space, / and > in separate chunks", async () => {
  const tokens: XmlToken[] = [];
  async function* chunks(): AsyncIterable<string> {
    yield "<item /";
    yield ">";
  }
  for await (const batch of tokenize(chunks())) {
    tokens.push(...batch);
  }
  assertEquals(tokens.length, 2);
  assertEquals(tokens[0]?.type, "start_tag_open");
  assertEquals(tokens[1]?.type, "start_tag_close");
  assertEquals((tokens[1] as { selfClosing: boolean }).selfClosing, true);
});

Deno.test("tokenize() handles self-closing tag with attributes and chunk boundary at /", async () => {
  const tokens: XmlToken[] = [];
  async function* chunks(): AsyncIterable<string> {
    yield '<item id="123"/';
    yield ">";
  }
  for await (const batch of tokenize(chunks())) {
    tokens.push(...batch);
  }
  assertEquals(tokens.length, 3);
  assertEquals(tokens[0]?.type, "start_tag_open");
  assertEquals(tokens[1]?.type, "attribute");
  assertEquals(tokens[2]?.type, "start_tag_close");
  assertEquals((tokens[2] as { selfClosing: boolean }).selfClosing, true);
});

// =============================================================================
// Comment chunk boundary tests (Issue #2 fix)
// =============================================================================

Deno.test("tokenize() handles comment ending -- and > in separate chunks", async () => {
  const tokens: XmlToken[] = [];
  async function* chunks(): AsyncIterable<string> {
    yield "<r><!-- hello --";
    yield "></r>";
  }
  for await (const batch of tokenize(chunks())) {
    tokens.push(...batch);
  }
  const comment = tokens.find((t) => t.type === "comment");
  assertEquals((comment as { content: string }).content, " hello ");
});

Deno.test("tokenize() handles comment ending - then - then > in separate chunks", async () => {
  const tokens: XmlToken[] = [];
  async function* chunks(): AsyncIterable<string> {
    yield "<r><!-- hi -";
    yield "-";
    yield "></r>";
  }
  for await (const batch of tokenize(chunks())) {
    tokens.push(...batch);
  }
  const comment = tokens.find((t) => t.type === "comment");
  assertEquals((comment as { content: string }).content, " hi ");
});

Deno.test("tokenize() handles comment with single dash at chunk boundary", async () => {
  const tokens: XmlToken[] = [];
  async function* chunks(): AsyncIterable<string> {
    yield "<r><!-- a-";
    yield "b --></r>";
  }
  for await (const batch of tokenize(chunks())) {
    tokens.push(...batch);
  }
  const comment = tokens.find((t) => t.type === "comment");
  assertEquals((comment as { content: string }).content, " a-b ");
});

Deno.test("tokenize() handles comment with -- inside (lenient)", async () => {
  // Per XML 1.0 §2.5, '--' inside comments is invalid, but we're lenient
  const tokens = await collectTokens("<r><!-- a--b --></r>");
  const comment = tokens.find((t) => t.type === "comment");
  assertEquals((comment as { content: string }).content, " a--b ");
});

Deno.test("tokenize() handles comment with --- inside (lenient)", async () => {
  // "---" means first dash is content, then "--" for the end
  const tokens = await collectTokens("<r><!-- test---></r>");
  const comment = tokens.find((t) => t.type === "comment");
  assertEquals((comment as { content: string }).content, " test-");
});

Deno.test("tokenize() handles comment with multiple dashes (lenient)", async () => {
  const tokens = await collectTokens("<r><!-- ---- --></r>");
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

Deno.test("tokenize() throws on invalid character in end tag name", async () => {
  // & is not a valid name character
  await assertRejects(
    async () => await collectTokens("<root></&>"),
    XmlSyntaxError,
    "Unexpected character",
  );
});

Deno.test("tokenize() throws on invalid character in DOCTYPE", async () => {
  // & is not valid after <!DOCTYPE
  await assertRejects(
    async () => await collectTokens("<!DOCTYPE &><root/>"),
    XmlSyntaxError,
    "Unexpected character",
  );
});

Deno.test("tokenize() throws on unclosed comment", async () => {
  await assertRejects(
    async () => await collectTokens("<root><!-- unclosed"),
    XmlSyntaxError,
    "Unterminated comment",
  );
});

Deno.test("tokenize() throws on unclosed CDATA", async () => {
  await assertRejects(
    async () => await collectTokens("<root><![CDATA[unclosed"),
    XmlSyntaxError,
    "Unterminated CDATA",
  );
});

Deno.test("tokenize() throws on unclosed attribute value", async () => {
  await assertRejects(
    async () => await collectTokens('<root attr="unclosed'),
    XmlSyntaxError,
    "Unterminated attribute value",
  );
});

Deno.test("tokenize() throws on invalid character after /", async () => {
  await assertRejects(
    async () => await collectTokens("<root/x>"),
    XmlSyntaxError,
    "Expected '>' after '/'",
  );
});

// =============================================================================
// XML declaration edge cases
// =============================================================================

Deno.test("tokenize() handles XML declaration with single quotes", async () => {
  const tokens = await collectTokens("<?xml version='1.0'?><root/>");
  const decl = tokens.find((t) => t.type === "declaration");
  assertEquals((decl as { version: string }).version, "1.0");
});

Deno.test("tokenize() handles XML declaration with mixed quotes", async () => {
  const tokens = await collectTokens(
    `<?xml version="1.0" encoding='UTF-8'?><root/>`,
  );
  const decl = tokens.find((t) => t.type === "declaration");
  assertEquals((decl as { version: string }).version, "1.0");
  assertEquals((decl as { encoding?: string }).encoding, "UTF-8");
});

Deno.test("tokenize() handles case-insensitive xml target", async () => {
  // Per XML spec, "xml" target is case-insensitive for declarations
  const tokens = await collectTokens('<?XML version="1.0"?><root/>');
  assertEquals(tokens[0]?.type, "declaration");
});

Deno.test("tokenize() handles mixed case xml target", async () => {
  const tokens = await collectTokens('<?xMl version="1.0"?><root/>');
  assertEquals(tokens[0]?.type, "declaration");
});

// =============================================================================
// DOCTYPE chunk boundary tests
// =============================================================================

Deno.test("tokenize() handles DOCTYPE with chunk boundary in name", async () => {
  const tokens: XmlToken[] = [];
  async function* chunks(): AsyncIterable<string> {
    yield "<!DOCTYPE ht";
    yield "ml><html/>";
  }
  for await (const batch of tokenize(chunks())) {
    tokens.push(...batch);
  }
  assertEquals(tokens[0]?.type, "doctype");
  assertEquals((tokens[0] as { name: string }).name, "html");
});

Deno.test("tokenize() handles DOCTYPE with chunk boundary in PUBLIC keyword", async () => {
  const tokens: XmlToken[] = [];
  async function* chunks(): AsyncIterable<string> {
    yield "<!DOCTYPE html PUB";
    yield 'LIC "-//W3C//DTD" "http://example.com"><html/>';
  }
  for await (const batch of tokenize(chunks())) {
    tokens.push(...batch);
  }
  assertEquals(tokens[0]?.type, "doctype");
  assertEquals((tokens[0] as { publicId?: string }).publicId, "-//W3C//DTD");
});

// =============================================================================
// Position tracking edge cases
// =============================================================================

Deno.test("tokenize() tracks position correctly with CRLF", async () => {
  const tokens = await collectTokens("<root>\r\n  <item/>\r\n</root>");
  const item = tokens.find(
    (t) =>
      t.type === "start_tag_open" && (t as { name: string }).name === "item",
  );
  // After CRLF normalization, line 2 column 3
  assertEquals((item as { position: { line: number } }).position.line, 2);
  assertEquals((item as { position: { column: number } }).position.column, 3);
});

Deno.test("tokenize() tracks offset correctly", async () => {
  const tokens = await collectTokens("<a><b/></a>");
  const b = tokens.find(
    (t) => t.type === "start_tag_open" && (t as { name: string }).name === "b",
  );
  // <a> is 3 chars, so <b starts at offset 3
  assertEquals((b as { position: { offset: number } }).position.offset, 3);
});

// =============================================================================
// CDATA closing sequence chunk boundary tests (P0 fix)
// =============================================================================

Deno.test("tokenize() handles CDATA with ] and ]> in separate chunks", async () => {
  const tokens: XmlToken[] = [];
  async function* chunks(): AsyncIterable<string> {
    yield "<r><![CDATA[foo]";
    yield "]></r>";
  }
  for await (const batch of tokenize(chunks())) {
    tokens.push(...batch);
  }
  const cdata = tokens.find((t) => t.type === "cdata");
  assertEquals((cdata as { content: string }).content, "foo");
});

Deno.test("tokenize() handles CDATA with ]] and > in separate chunks", async () => {
  const tokens: XmlToken[] = [];
  async function* chunks(): AsyncIterable<string> {
    yield "<r><![CDATA[bar]]";
    yield "></r>";
  }
  for await (const batch of tokenize(chunks())) {
    tokens.push(...batch);
  }
  const cdata = tokens.find((t) => t.type === "cdata");
  assertEquals((cdata as { content: string }).content, "bar");
});

Deno.test("tokenize() handles CDATA with ] then ] then > in separate chunks", async () => {
  const tokens: XmlToken[] = [];
  async function* chunks(): AsyncIterable<string> {
    yield "<r><![CDATA[baz]";
    yield "]";
    yield "></r>";
  }
  for await (const batch of tokenize(chunks())) {
    tokens.push(...batch);
  }
  const cdata = tokens.find((t) => t.type === "cdata");
  assertEquals((cdata as { content: string }).content, "baz");
});

Deno.test("tokenize() handles CDATA with ]]] sequence", async () => {
  // First ] is content, then ]]> closes
  const tokens = await collectTokens("<r><![CDATA[x]]]></r>");
  const cdata = tokens.find((t) => t.type === "cdata");
  assertEquals((cdata as { content: string }).content, "x]");
});

Deno.test("tokenize() handles CDATA with ]]] across chunks", async () => {
  const tokens: XmlToken[] = [];
  async function* chunks(): AsyncIterable<string> {
    yield "<r><![CDATA[x]";
    yield "]]></r>";
  }
  for await (const batch of tokenize(chunks())) {
    tokens.push(...batch);
  }
  const cdata = tokens.find((t) => t.type === "cdata");
  assertEquals((cdata as { content: string }).content, "x]");
});

// =============================================================================
// PI closing sequence chunk boundary tests (P0 fix)
// =============================================================================

Deno.test("tokenize() handles PI with ? and > in separate chunks", async () => {
  const tokens: XmlToken[] = [];
  async function* chunks(): AsyncIterable<string> {
    yield "<?php echo 'hi'; ?";
    yield "><root/>";
  }
  for await (const batch of tokenize(chunks())) {
    tokens.push(...batch);
  }
  const pi = tokens.find((t) => t.type === "processing_instruction");
  assertEquals((pi as { target: string }).target, "php");
  assertEquals((pi as { content: string }).content, "echo 'hi';");
});

Deno.test("tokenize() handles empty PI with ? and > in separate chunks", async () => {
  const tokens: XmlToken[] = [];
  async function* chunks(): AsyncIterable<string> {
    yield "<?target?";
    yield "><root/>";
  }
  for await (const batch of tokenize(chunks())) {
    tokens.push(...batch);
  }
  const pi = tokens.find((t) => t.type === "processing_instruction");
  assertEquals((pi as { target: string }).target, "target");
  assertEquals((pi as { content: string }).content, "");
});

Deno.test("tokenize() handles PI with ?? in content", async () => {
  const tokens = await collectTokens("<?target is this a question???><root/>");
  const pi = tokens.find((t) => t.type === "processing_instruction");
  assertEquals((pi as { target: string }).target, "target");
  assertEquals((pi as { content: string }).content, "is this a question??");
});

Deno.test("tokenize() handles PI with ?? across chunk boundary", async () => {
  const tokens: XmlToken[] = [];
  async function* chunks(): AsyncIterable<string> {
    yield "<?target a?";
    yield "?><root/>";
  }
  for await (const batch of tokenize(chunks())) {
    tokens.push(...batch);
  }
  const pi = tokens.find((t) => t.type === "processing_instruction");
  assertEquals((pi as { content: string }).content, "a?");
});

Deno.test("tokenize() handles XML declaration with ? and > in separate chunks", async () => {
  const tokens: XmlToken[] = [];
  async function* chunks(): AsyncIterable<string> {
    yield '<?xml version="1.0" encoding="UTF-8"?';
    yield "><root/>";
  }
  for await (const batch of tokenize(chunks())) {
    tokens.push(...batch);
  }
  const decl = tokens.find((t) => t.type === "declaration");
  assertEquals((decl as { version: string }).version, "1.0");
  assertEquals((decl as { encoding?: string }).encoding, "UTF-8");
});

// =============================================================================
// Additional coverage: Attribute name with whitespace before =
// =============================================================================

Deno.test("tokenize() handles whitespace between attribute name and =", async () => {
  const tokens = await collectTokens('<item attr   =  "value"/>');
  const attrs = tokens.filter(isTokenType("attribute"));
  assertEquals(attrs.length, 1);
  assertEquals(attrs[0]?.name, "attr");
  assertEquals(attrs[0]?.value, "value");
});

Deno.test("tokenize() handles newlines between attribute name and =", async () => {
  const tokens = await collectTokens('<item attr\n\t=\n\t"value"/>');
  const attrs = tokens.filter(isTokenType("attribute"));
  assertEquals(attrs.length, 1);
  assertEquals(attrs[0]?.value, "value");
});

Deno.test("tokenize() throws when = missing after attribute name", async () => {
  await assertRejects(
    async () => await collectTokens('<item attr "value"/>'),
    XmlSyntaxError,
    "Expected '=' after attribute name",
  );
});

// =============================================================================
// Additional coverage: End tag with whitespace before >
// =============================================================================

Deno.test("tokenize() handles whitespace in end tag before >", async () => {
  const tokens = await collectTokens("<root></root   >");
  assertEquals(tokens.length, 3);
  assertEquals(tokens[2]?.type, "end_tag");
  assertEquals((tokens[2] as { name: string }).name, "root");
});

Deno.test("tokenize() handles newline in end tag before >", async () => {
  const tokens = await collectTokens("<root></root\n>");
  assertEquals(tokens.length, 3);
  assertEquals((tokens[2] as { name: string }).name, "root");
});

Deno.test("tokenize() throws on invalid character in end tag after name", async () => {
  await assertRejects(
    async () => await collectTokens("<root></root!>"),
    XmlSyntaxError,
    "Unexpected character",
  );
});

// =============================================================================
// Additional coverage: DOCTYPE edge cases
// =============================================================================

Deno.test("tokenize() handles DOCTYPE PUBLIC without system ID", async () => {
  const tokens = await collectTokens(
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

Deno.test("tokenize() throws on invalid keyword after DOCTYPE name", async () => {
  await assertRejects(
    async () => await collectTokens("<!DOCTYPE html INVALID><html/>"),
    XmlSyntaxError,
    "Unexpected character",
  );
});

Deno.test("tokenize() throws on missing quote after PUBLIC", async () => {
  await assertRejects(
    async () => await collectTokens("<!DOCTYPE html PUBLIC -//W3C//><html/>"),
    XmlSyntaxError,
    "Expected quote to start public ID",
  );
});

Deno.test("tokenize() throws on missing system ID quote after public ID", async () => {
  await assertRejects(
    async () =>
      await collectTokens(
        '<!DOCTYPE html PUBLIC "-//W3C//" system.dtd><html/>',
      ),
    XmlSyntaxError,
    "Expected system ID or '>'",
  );
});

Deno.test("tokenize() throws on invalid SYSTEM keyword", async () => {
  await assertRejects(
    async () => await collectTokens('<!DOCTYPE html SYSTE "test.dtd"><html/>'),
    XmlSyntaxError,
    "Expected SYSTEM",
  );
});

Deno.test("tokenize() throws on missing quote after SYSTEM", async () => {
  await assertRejects(
    async () => await collectTokens("<!DOCTYPE html SYSTEM test.dtd><html/>"),
    XmlSyntaxError,
    "Expected quote to start system ID",
  );
});

Deno.test("tokenize() throws on invalid PUBLIC keyword", async () => {
  await assertRejects(
    async () => await collectTokens('<!DOCTYPE html PUBLI "-//W3C//"><html/>'),
    XmlSyntaxError,
    "Expected PUBLIC",
  );
});

// =============================================================================
// Additional coverage: CDATA opening sequence error
// =============================================================================

Deno.test("tokenize() throws on invalid CDATA opening", async () => {
  await assertRejects(
    async () => await collectTokens("<root><![CDAT[content]]></root>"),
    XmlSyntaxError,
    "Expected 'CDATA[' after '<![",
  );
});

// =============================================================================
// Additional coverage: PI target edge cases
// =============================================================================

Deno.test("tokenize() throws on invalid character in PI target", async () => {
  // & is not a valid name character
  await assertRejects(
    async () => await collectTokens("<?&invalid?><root/>"),
    XmlSyntaxError,
    "Unexpected character",
  );
});

Deno.test("tokenize() throws on invalid character after ? in PI target", async () => {
  await assertRejects(
    async () => await collectTokens("<?target?x><root/>"),
    XmlSyntaxError,
    "Expected '>' after '?' in processing instruction",
  );
});

// =============================================================================
// Additional coverage: Comment start error
// =============================================================================

Deno.test("tokenize() throws on single dash after <!", async () => {
  await assertRejects(
    async () => await collectTokens("<root><!-x></root>"),
    XmlSyntaxError,
    "Expected '-' to start comment",
  );
});

// =============================================================================
// Additional coverage: PI content with ?> across chunks (PI_QUESTION state)
// =============================================================================

Deno.test("tokenize() handles PI content ending with ? then non-> char then ?>", async () => {
  const tokens = await collectTokens("<?target content?x?><root/>");
  const pi = tokens.find((t) => t.type === "processing_instruction");
  assertEquals((pi as { content: string }).content, "content?x");
});

// =============================================================================
// Additional coverage: XML declaration without version (defaults to 1.0)
// =============================================================================

Deno.test("tokenize() handles XML declaration without explicit version", async () => {
  // Note: technically invalid XML but tokenizer is lenient
  const tokens = await collectTokens('<?xml encoding="UTF-8"?><root/>');
  const decl = tokens.find((t) => t.type === "declaration");
  assertEquals((decl as { version: string }).version, "1.0"); // default
  assertEquals((decl as { encoding?: string }).encoding, "UTF-8");
});

Deno.test("tokenize() handles XML declaration with only standalone", async () => {
  const tokens = await collectTokens('<?xml standalone="yes"?><root/>');
  const decl = tokens.find((t) => t.type === "declaration");
  assertEquals((decl as { standalone?: string }).standalone, "yes");
});

// =============================================================================
// Additional coverage: Simple error cases
// =============================================================================

Deno.test("tokenize() throws on invalid character after <", async () => {
  await assertRejects(
    async () => await collectTokens("<@root/>"),
    XmlSyntaxError,
    "Unexpected character",
  );
});

Deno.test("tokenize() throws on < in single-quoted attribute value", async () => {
  await assertRejects(
    async () => await collectTokens("<root attr='<'/>"),
    XmlSyntaxError,
    "'<' not allowed in attribute value",
  );
});

Deno.test("tokenize() throws on unsupported markup declaration", async () => {
  await assertRejects(
    async () => await collectTokens("<root><!X></root>"),
    XmlSyntaxError,
    "Unsupported markup declaration",
  );
});

Deno.test("tokenize() handles DOCTYPE with internal subset directly after name", async () => {
  const tokens = await collectTokens(
    "<!DOCTYPE root[<!ELEMENT root ANY>]><root/>",
  );
  assertEquals(tokens[0]?.type, "doctype");
  assertEquals((tokens[0] as { name: string }).name, "root");
});

Deno.test("tokenize() handles DOCTYPE internal subset with nested brackets", async () => {
  const tokens = await collectTokens(
    '<!DOCTYPE root [<!ENTITY x "[">]><root/>',
  );
  assertEquals(tokens[0]?.type, "doctype");
});

// =============================================================================
// Coverage: Error paths
// =============================================================================

Deno.test("tokenize() throws on invalid character after tag name", async () => {
  await assertRejects(
    async () => await collectTokens("<item @/>"),
    XmlSyntaxError,
    "Unexpected character",
  );
});

Deno.test("tokenize() throws on invalid character in attribute name", async () => {
  await assertRejects(
    async () => await collectTokens('<item attr@="value"/>'),
    XmlSyntaxError,
    "Unexpected character",
  );
});

Deno.test("tokenize() throws on invalid character in end tag after whitespace", async () => {
  await assertRejects(
    async () => await collectTokens("<root></root @>"),
    XmlSyntaxError,
    "Unexpected character",
  );
});

Deno.test("tokenize() throws on invalid DOCTYPE keyword", async () => {
  await assertRejects(
    async () => await collectTokens("<!DOCTYP html><root/>"),
    XmlSyntaxError,
    "Expected DOCTYPE",
  );
});

// =============================================================================
// DOCTYPE internal subset nested brackets
// =============================================================================

Deno.test("tokenize() handles DOCTYPE internal subset with actual nested brackets", async () => {
  // This tests nested [ inside internal subset (lines 763-766)
  // The nested [ must be outside of quotes to hit the bracket tracking code
  const tokens = await collectTokens(
    "<!DOCTYPE root [<!ATTLIST x y CDATA #IMPLIED>]><root/>",
  );
  assertEquals(tokens[0]?.type, "doctype");
  assertEquals((tokens[0] as { name: string }).name, "root");
});

Deno.test("tokenize() handles DOCTYPE internal subset with nested conditional sections", async () => {
  // DOCTYPE with INCLUDE conditional section creates nested brackets
  const tokens = await collectTokens(
    "<!DOCTYPE root [<![INCLUDE[<!ELEMENT root ANY>]]>]><root/>",
  );
  assertEquals(tokens[0]?.type, "doctype");
});

// =============================================================================
// DOCTYPE internal subset edge cases
// =============================================================================

Deno.test("tokenize() handles DOCTYPE internal subset with deeply nested brackets", async () => {
  const tokens = await collectTokens(
    '<!DOCTYPE root [<!ENTITY x "["><!ENTITY y "[">]><root/>',
  );
  assertEquals(tokens[0]?.type, "doctype");
});

// =============================================================================
// CDATA edge cases
// =============================================================================

Deno.test("tokenize() handles CDATA with single ] in content", async () => {
  const tokens = await collectTokens("<r><![CDATA[a]b]]></r>");
  const cdata = tokens.find((t) => t.type === "cdata");
  assertEquals((cdata as { content: string }).content, "a]b");
});

// =============================================================================
// XML declaration edge cases
// =============================================================================

Deno.test("tokenize() handles empty XML declaration", async () => {
  const tokens = await collectTokens("<?xml?><root/>");
  const decl = tokens.find((t) => t.type === "declaration");
  assertEquals((decl as { version: string }).version, "1.0");
});

Deno.test("tokenize() handles XML declaration with single-quoted standalone", async () => {
  const tokens = await collectTokens(
    "<?xml version='1.0' standalone='no'?><root/>",
  );
  const decl = tokens.find((t) => t.type === "declaration");
  assertEquals((decl as { standalone?: string }).standalone, "no");
});
