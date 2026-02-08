// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertThrows } from "@std/assert";
import { XmlTokenizer } from "./_tokenizer.ts";
import type { XmlTokenCallbacks } from "./types.ts";
import { XmlSyntaxError } from "./types.ts";

/** Token type for testing - recreates the old token structure for assertions. */
interface XmlToken {
  type: string;
  name?: string;
  value?: string;
  content?: string;
  target?: string;
  version?: string;
  encoding?: string;
  standalone?: "yes" | "no";
  publicId?: string;
  systemId?: string;
  selfClosing?: boolean;
  position?: { line: number; column: number; offset: number };
}

/** Creates callbacks that collect tokens into an array. */
function createCollector(): {
  tokens: XmlToken[];
  callbacks: XmlTokenCallbacks;
} {
  const tokens: XmlToken[] = [];
  const callbacks: XmlTokenCallbacks = {
    onStartTagOpen(name, line, column, offset) {
      tokens.push({
        type: "start_tag_open",
        name,
        position: { line, column, offset },
      });
    },
    onAttribute(name, value) {
      tokens.push({ type: "attribute", name, value });
    },
    onStartTagClose(selfClosing) {
      tokens.push({ type: "start_tag_close", selfClosing });
    },
    onEndTag(name, line, column, offset) {
      tokens.push({
        type: "end_tag",
        name,
        position: { line, column, offset },
      });
    },
    onText(content, line, column, offset) {
      tokens.push({
        type: "text",
        content,
        position: { line, column, offset },
      });
    },
    onCData(content, line, column, offset) {
      tokens.push({
        type: "cdata",
        content,
        position: { line, column, offset },
      });
    },
    onComment(content, line, column, offset) {
      tokens.push({
        type: "comment",
        content,
        position: { line, column, offset },
      });
    },
    onProcessingInstruction(target, content, line, column, offset) {
      tokens.push({
        type: "processing_instruction",
        target,
        content,
        position: { line, column, offset },
      });
    },
    onDeclaration(version, encoding, standalone, line, column, offset) {
      tokens.push({
        type: "declaration",
        version,
        ...(encoding !== undefined ? { encoding } : {}),
        ...(standalone !== undefined ? { standalone } : {}),
        position: { line, column, offset },
      } as XmlToken);
    },
    onDoctype(name, publicId, systemId, line, column, offset) {
      tokens.push({
        type: "doctype",
        name,
        ...(publicId !== undefined ? { publicId } : {}),
        ...(systemId !== undefined ? { systemId } : {}),
        position: { line, column, offset },
      } as XmlToken);
    },
  };
  return { tokens, callbacks };
}

/** Helper to collect tokens from a string synchronously. */
function collectTokens(xml: string): XmlToken[] {
  const tokenizer = new XmlTokenizer();
  const { tokens, callbacks } = createCollector();
  tokenizer.process(xml, callbacks);
  tokenizer.finalize(callbacks);
  return tokens;
}

/** Helper to collect tokens from multiple chunks (tests cross-chunk boundaries). */
function collectChunkedTokens(...chunks: string[]): XmlToken[] {
  const tokenizer = new XmlTokenizer();
  const { tokens, callbacks } = createCollector();
  for (const chunk of chunks) {
    tokenizer.process(chunk, callbacks);
  }
  tokenizer.finalize(callbacks);
  return tokens;
}

/** Type predicate for filtering tokens by type. */
function isTokenType<T extends string>(
  type: T,
): (token: XmlToken) => token is XmlToken & { type: T } {
  return (token): token is XmlToken & { type: T } => token.type === type;
}

// =============================================================================
// Basic element tests
// =============================================================================

Deno.test("XmlTokenizer.process() handles simple element", () => {
  const tokens = collectTokens("<root></root>");
  assertEquals(tokens.length, 3);
  assertEquals(tokens[0]?.type, "start_tag_open");
  assertEquals(tokens[0]?.name, "root");
  assertEquals(tokens[1]?.type, "start_tag_close");
  assertEquals(tokens[2]?.type, "end_tag");
  assertEquals(tokens[2]?.name, "root");
});

Deno.test("XmlTokenizer.process() handles self-closing element", () => {
  const tokens = collectTokens("<item/>");
  assertEquals(tokens.length, 2);
  assertEquals(tokens[0]?.type, "start_tag_open");
  assertEquals(tokens[0]?.name, "item");
  assertEquals(tokens[1]?.type, "start_tag_close");
  assertEquals(tokens[1]?.selfClosing, true);
});

Deno.test("XmlTokenizer.process() handles self-closing element with space", () => {
  const tokens = collectTokens("<item />");
  assertEquals(tokens.length, 2);
  assertEquals(tokens[0]?.type, "start_tag_open");
  assertEquals(tokens[1]?.type, "start_tag_close");
  assertEquals(tokens[1]?.selfClosing, true);
});

Deno.test("XmlTokenizer.process() handles nested elements", () => {
  const tokens = collectTokens("<a><b></b></a>");
  assertEquals(tokens.length, 6);
  assertEquals(tokens[0]?.name, "a");
  assertEquals(tokens[2]?.name, "b");
  assertEquals(tokens[4]?.name, "b");
  assertEquals(tokens[5]?.name, "a");
});

// =============================================================================
// Attribute tests
// =============================================================================

Deno.test("XmlTokenizer.process() handles single attribute", () => {
  const tokens = collectTokens('<item id="123"/>');
  assertEquals(tokens.length, 3);
  assertEquals(tokens[1]?.type, "attribute");
  assertEquals(tokens[1]?.name, "id");
  assertEquals(tokens[1]?.value, "123");
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
  assertEquals(attr?.value, "123");
});

Deno.test("XmlTokenizer.process() handles attributes with entities", () => {
  const tokens = collectTokens('<item value="a&lt;b"/>');
  const attr = tokens.find((t) => t.type === "attribute");
  // Tokenizer does NOT decode entities - that's the parser's job
  assertEquals(attr?.value, "a&lt;b");
});

Deno.test("XmlTokenizer.process() handles namespaced attributes", () => {
  const tokens = collectTokens('<item xml:lang="en"/>');
  const attr = tokens.find((t) => t.type === "attribute");
  assertEquals(attr?.name, "xml:lang");
});

// =============================================================================
// Text content tests
// =============================================================================

Deno.test("XmlTokenizer.process() handles text content", () => {
  const tokens = collectTokens("<root>Hello World</root>");
  const text = tokens.find((t) => t.type === "text");
  assertEquals(text?.content, "Hello World");
});

Deno.test("XmlTokenizer.process() handles text with entities", () => {
  const tokens = collectTokens("<root>&lt;test&gt;</root>");
  const text = tokens.find((t) => t.type === "text");
  // Tokenizer does NOT decode entities
  assertEquals(text?.content, "&lt;test&gt;");
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
  assertEquals(cdata?.content, "<script>");
});

Deno.test("XmlTokenizer.process() handles CDATA with special chars", () => {
  const tokens = collectTokens("<r><![CDATA[a & b < c]]></r>");
  const cdata = tokens.find((t) => t.type === "cdata");
  assertEquals(cdata?.content, "a & b < c");
});

Deno.test("XmlTokenizer.process() handles CDATA with ]] inside", () => {
  const tokens = collectTokens("<r><![CDATA[a]]b]]></r>");
  const cdata = tokens.find((t) => t.type === "cdata");
  assertEquals(cdata?.content, "a]]b");
});

// =============================================================================
// Comment tests
// =============================================================================

Deno.test("XmlTokenizer.process() handles comment", () => {
  const tokens = collectTokens("<root><!-- comment --></root>");
  const comment = tokens.find((t) => t.type === "comment");
  assertEquals(comment?.content, " comment ");
});

Deno.test("XmlTokenizer.process() handles empty comment", () => {
  const tokens = collectTokens("<root><!----></root>");
  const comment = tokens.find((t) => t.type === "comment");
  assertEquals(comment?.content, "");
});

Deno.test("XmlTokenizer.process() handles comment with dashes", () => {
  const tokens = collectTokens("<root><!-- a-b-c --></root>");
  const comment = tokens.find((t) => t.type === "comment");
  assertEquals(comment?.content, " a-b-c ");
});

// =============================================================================
// Processing instruction tests
// =============================================================================

Deno.test("XmlTokenizer.process() handles processing instruction", () => {
  const tokens = collectTokens("<?php echo 'hi'; ?><root/>");
  const pi = tokens.find((t) => t.type === "processing_instruction");
  assertEquals(pi?.target, "php");
  assertEquals(pi?.content, "echo 'hi';");
});

Deno.test("XmlTokenizer.process() handles empty processing instruction", () => {
  const tokens = collectTokens("<?target?><root/>");
  const pi = tokens.find((t) => t.type === "processing_instruction");
  assertEquals(pi?.target, "target");
  assertEquals(pi?.content, "");
});

// =============================================================================
// XML declaration tests
// =============================================================================

Deno.test("XmlTokenizer.process() handles XML declaration", () => {
  const tokens = collectTokens('<?xml version="1.0"?><root/>');
  const decl = tokens.find((t) => t.type === "declaration");
  assertEquals(decl?.version, "1.0");
});

Deno.test("XmlTokenizer.process() handles XML declaration with encoding", () => {
  const tokens = collectTokens(
    '<?xml version="1.0" encoding="UTF-8"?><root/>',
  );
  const decl = tokens.find((t) => t.type === "declaration");
  assertEquals(decl?.version, "1.0");
  assertEquals(decl?.encoding, "UTF-8");
});

Deno.test("XmlTokenizer.process() handles XML declaration with standalone", () => {
  const tokens = collectTokens(
    '<?xml version="1.0" standalone="yes"?><root/>',
  );
  const decl = tokens.find((t) => t.type === "declaration");
  assertEquals(decl?.standalone, "yes");
});

Deno.test("XmlTokenizer.process() handles full XML declaration", () => {
  const tokens = collectTokens(
    '<?xml version="1.0" encoding="UTF-8" standalone="no"?><root/>',
  );
  const decl = tokens.find((t) => t.type === "declaration");
  assertEquals(decl?.version, "1.0");
  assertEquals(decl?.encoding, "UTF-8");
  assertEquals(decl?.standalone, "no");
});

// =============================================================================
// Line ending normalization tests
// =============================================================================

Deno.test("XmlTokenizer.process() normalizes CRLF to LF", () => {
  const tokens = collectTokens("<root>a\r\nb</root>");
  const text = tokens.find((t) => t.type === "text");
  assertEquals(text?.content, "a\nb");
});

Deno.test("XmlTokenizer.process() normalizes CR to LF", () => {
  const tokens = collectTokens("<root>a\rb</root>");
  const text = tokens.find((t) => t.type === "text");
  assertEquals(text?.content, "a\nb");
});

// =============================================================================
// Position tracking tests
// =============================================================================

Deno.test("XmlTokenizer.process() tracks position correctly", () => {
  const tokens = collectTokens("<root>\n  <item/>\n</root>");
  const item = tokens.find(
    (t) => t.type === "start_tag_open" && t.name === "item",
  );
  assertEquals(item?.position?.line, 2);
  assertEquals(item?.position?.column, 3);
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
  assertEquals(tokens[0]?.name, "ns:root");
  assertEquals(tokens[2]?.name, "ns:root");
});

// =============================================================================
// Whitespace handling tests
// =============================================================================

Deno.test("XmlTokenizer.process() preserves whitespace in text", () => {
  const tokens = collectTokens("<root>  spaced  </root>");
  const text = tokens.find((t) => t.type === "text");
  assertEquals(text?.content, "  spaced  ");
});

Deno.test("XmlTokenizer.process() handles whitespace-only text", () => {
  const tokens = collectTokens("<root>   </root>");
  const text = tokens.find((t) => t.type === "text");
  assertEquals(text?.content, "   ");
});

// =============================================================================
// Edge case tests
// =============================================================================

Deno.test("XmlTokenizer.process() handles Unicode in element names", () => {
  const tokens = collectTokens("<日本語></日本語>");
  const open = tokens.find((t) => t.type === "start_tag_open");
  const end = tokens.find((t) => t.type === "end_tag");
  assertEquals(open?.name, "日本語");
  assertEquals(end?.name, "日本語");
});

Deno.test("XmlTokenizer.process() handles Unicode in attribute values", () => {
  const tokens = collectTokens('<item name="日本語"/>');
  const attr = tokens.find((t) => t.type === "attribute");
  assertEquals(attr?.value, "日本語");
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
  assertEquals(open?.name, "root");
});

Deno.test("XmlTokenizer.process() handles chunk boundary in attribute value", () => {
  const tokens = collectChunkedTokens('<item attr="val', 'ue"/>');
  const attr = tokens.find((t) => t.type === "attribute");
  assertEquals(attr?.value, "value");
});

Deno.test("XmlTokenizer.process() handles chunk boundary in CDATA", () => {
  const tokens = collectChunkedTokens("<r><![CDA", "TA[content]]></r>");
  const cdata = tokens.find((t) => t.type === "cdata");
  assertEquals(cdata?.content, "content");
});

Deno.test("XmlTokenizer.process() handles chunk boundary in comment", () => {
  const tokens = collectChunkedTokens("<r><!--com", "ment--></r>");
  const comment = tokens.find((t) => t.type === "comment");
  assertEquals(comment?.content, "comment");
});

// =============================================================================
// DOCTYPE tests
// =============================================================================

Deno.test("XmlTokenizer.process() handles simple DOCTYPE", () => {
  const tokens = collectTokens("<!DOCTYPE html><html></html>");
  assertEquals(tokens[0]?.type, "doctype");
  assertEquals(tokens[0]?.name, "html");
});

Deno.test("XmlTokenizer.process() handles DOCTYPE with PUBLIC identifier", () => {
  const tokens = collectTokens(
    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"><html></html>',
  );
  assertEquals(tokens[0]?.type, "doctype");
  assertEquals(tokens[0]?.name, "html");
  assertEquals(tokens[0]?.publicId, "-//W3C//DTD XHTML 1.0 Strict//EN");
  assertEquals(
    tokens[0]?.systemId,
    "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd",
  );
});

Deno.test("XmlTokenizer.process() handles DOCTYPE with SYSTEM identifier", () => {
  const tokens = collectTokens(
    '<!DOCTYPE greeting SYSTEM "hello.dtd"><greeting></greeting>',
  );
  assertEquals(tokens[0]?.type, "doctype");
  assertEquals(tokens[0]?.name, "greeting");
  assertEquals(tokens[0]?.publicId, undefined);
  assertEquals(tokens[0]?.systemId, "hello.dtd");
});

Deno.test("XmlTokenizer.process() handles DOCTYPE with internal subset", () => {
  const tokens = collectTokens(
    '<!DOCTYPE root [<!ELEMENT root (#PCDATA)><!ENTITY greeting "Hello">]><root></root>',
  );
  assertEquals(tokens[0]?.type, "doctype");
  assertEquals(tokens[0]?.name, "root");
  assertEquals(tokens[1]?.type, "start_tag_open");
});

// =============================================================================
// Self-closing tag chunk boundary tests
// =============================================================================

Deno.test("XmlTokenizer.process() handles self-closing tag with / and > in separate chunks", () => {
  const tokens = collectChunkedTokens("<item/", ">");
  assertEquals(tokens.length, 2);
  assertEquals(tokens[0]?.type, "start_tag_open");
  assertEquals(tokens[0]?.name, "item");
  assertEquals(tokens[1]?.type, "start_tag_close");
  assertEquals(tokens[1]?.selfClosing, true);
});

// =============================================================================
// Comment chunk boundary tests
// =============================================================================

Deno.test("XmlTokenizer.process() handles comment ending -- and > in separate chunks", () => {
  const tokens = collectChunkedTokens("<r><!-- hello --", "></r>");
  const comment = tokens.find((t) => t.type === "comment");
  assertEquals(comment?.content, " hello ");
});

Deno.test("XmlTokenizer.process() throws on -- inside comment", () => {
  assertThrows(
    () => collectTokens("<r><!-- a--b --></r>"),
    XmlSyntaxError,
    "'--' is not permitted within comments",
  );
});

// =============================================================================
// Additional error handling tests
// =============================================================================

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

// =============================================================================
// XML declaration edge cases
// =============================================================================

Deno.test("XmlTokenizer.process() handles XML declaration with single quotes", () => {
  const tokens = collectTokens("<?xml version='1.0'?><root/>");
  const decl = tokens.find((t) => t.type === "declaration");
  assertEquals(decl?.version, "1.0");
});

Deno.test("XmlTokenizer.process() rejects reserved PI target case variants (XML 1.0 §2.6)", () => {
  // XML 1.0 §2.6: "xml" target must be lowercase; case variants are reserved
  assertThrows(
    () => collectTokens('<?XML version="1.0"?><root/>'),
    XmlSyntaxError,
    "'XML' is reserved; 'xml' must be lowercase",
  );
  assertThrows(
    () => collectTokens('<?xMl version="1.0"?><root/>'),
    XmlSyntaxError,
    "'xMl' is reserved; 'xml' must be lowercase",
  );
});

// =============================================================================
// Position tracking edge cases
// =============================================================================

Deno.test("XmlTokenizer.process() tracks position correctly with CRLF", () => {
  const tokens = collectTokens("<root>\r\n  <item/>\r\n</root>");
  const item = tokens.find(
    (t) => t.type === "start_tag_open" && t.name === "item",
  );
  assertEquals(item?.position?.line, 2);
  assertEquals(item?.position?.column, 3);
});

Deno.test("XmlTokenizer.process() tracks offset correctly", () => {
  const tokens = collectTokens("<a><b/></a>");
  const b = tokens.find(
    (t) => t.type === "start_tag_open" && t.name === "b",
  );
  assertEquals(b?.position?.offset, 3);
});

// =============================================================================
// CDATA closing sequence chunk boundary tests
// =============================================================================

Deno.test("XmlTokenizer.process() handles CDATA with ] and ]> in separate chunks", () => {
  const tokens = collectChunkedTokens("<r><![CDATA[foo]", "]></r>");
  const cdata = tokens.find((t) => t.type === "cdata");
  assertEquals(cdata?.content, "foo");
});

Deno.test("XmlTokenizer.process() handles CDATA with ]] and > in separate chunks", () => {
  const tokens = collectChunkedTokens("<r><![CDATA[bar]]", "></r>");
  const cdata = tokens.find((t) => t.type === "cdata");
  assertEquals(cdata?.content, "bar");
});

// =============================================================================
// PI closing sequence chunk boundary tests
// =============================================================================

Deno.test("XmlTokenizer.process() handles PI with ? and > in separate chunks", () => {
  const tokens = collectChunkedTokens("<?php echo 'hi'; ?", "><root/>");
  const pi = tokens.find((t) => t.type === "processing_instruction");
  assertEquals(pi?.target, "php");
  assertEquals(pi?.content, "echo 'hi';");
});

Deno.test("XmlTokenizer.process() handles XML declaration with ? and > in separate chunks", () => {
  const tokens = collectChunkedTokens(
    '<?xml version="1.0" encoding="UTF-8"?',
    "><root/>",
  );
  const decl = tokens.find((t) => t.type === "declaration");
  assertEquals(decl?.version, "1.0");
  assertEquals(decl?.encoding, "UTF-8");
});

// =============================================================================
// Finalize error path tests
// =============================================================================

Deno.test("XmlTokenizer.finalize() throws for input ending with <", () => {
  const tokenizer = new XmlTokenizer();
  const { callbacks } = createCollector();
  tokenizer.process("<", callbacks);
  assertThrows(
    () => tokenizer.finalize(callbacks),
    XmlSyntaxError,
    "Unexpected end of input after '<'",
  );
});

Deno.test("XmlTokenizer.finalize() throws for unclosed PI content", () => {
  const tokenizer = new XmlTokenizer();
  const { callbacks } = createCollector();
  tokenizer.process("<?target content", callbacks);
  assertThrows(
    () => tokenizer.finalize(callbacks),
    XmlSyntaxError,
    "Unterminated processing instruction",
  );
});

Deno.test("XmlTokenizer.finalize() throws for unclosed DOCTYPE", () => {
  const tokenizer = new XmlTokenizer();
  const { callbacks } = createCollector();
  tokenizer.process("<!DOCTYPE html", callbacks);
  assertThrows(
    () => tokenizer.finalize(callbacks),
    XmlSyntaxError,
    "Unterminated DOCTYPE",
  );
});

// =============================================================================
// End tag whitespace handling tests
// =============================================================================

Deno.test("XmlTokenizer.process() handles end tag with whitespace before >", () => {
  const tokens = collectTokens("<root></root >");
  assertEquals(tokens[2]?.type, "end_tag");
  assertEquals(tokens[2]?.name, "root");
});

Deno.test("XmlTokenizer.process() handles end tag with multiple whitespace before >", () => {
  const tokens = collectTokens("<item></item   >");
  assertEquals(tokens[2]?.type, "end_tag");
  assertEquals(tokens[2]?.name, "item");
});

// =============================================================================
// Attribute whitespace handling tests
// =============================================================================

Deno.test("XmlTokenizer.process() handles whitespace around attribute =", () => {
  const tokens = collectTokens('<item attr = "value"/>');
  const attr = tokens.find((t) => t.type === "attribute");
  assertEquals(attr?.name, "attr");
  assertEquals(attr?.value, "value");
});

Deno.test("XmlTokenizer.process() handles whitespace before attribute value", () => {
  const tokens = collectTokens('<item attr=  "value"/>');
  const attr = tokens.find((t) => t.type === "attribute");
  assertEquals(attr?.value, "value");
});

// =============================================================================
// PI chunk boundary tests (target/content split)
// =============================================================================

Deno.test("XmlTokenizer.process() handles PI target split across chunks", () => {
  const tokens = collectChunkedTokens("<?tar", "get content?><root/>");
  const pi = tokens.find((t) => t.type === "processing_instruction");
  assertEquals(pi?.target, "target");
  assertEquals(pi?.content, "content");
});

Deno.test("XmlTokenizer.process() handles PI content split across chunks", () => {
  const tokens = collectChunkedTokens("<?php echo ", "'hello';?><root/>");
  const pi = tokens.find((t) => t.type === "processing_instruction");
  assertEquals(pi?.target, "php");
  assertEquals(pi?.content, "echo 'hello';");
});

// =============================================================================
// Position tracking disabled tests
// =============================================================================

Deno.test("XmlTokenizer with trackPosition: false uses default positions", () => {
  const tokenizer = new XmlTokenizer({ trackPosition: false });
  const { tokens, callbacks } = createCollector();
  tokenizer.process("<root>\n  <item/>\n</root>", callbacks);
  tokenizer.finalize(callbacks);

  // When tracking is disabled, all tokens receive default positions (1, 1, 0)
  // regardless of their actual location in the document
  const root = tokens.find((t) =>
    t.type === "start_tag_open" && t.name === "root"
  );
  const item = tokens.find((t) =>
    t.type === "start_tag_open" && t.name === "item"
  );
  assertEquals(root?.position?.line, 1);
  assertEquals(item?.position?.line, 1); // Would be 2 with tracking enabled
  assertEquals(item?.position?.column, 1); // Would be 3 with tracking enabled
});

// =============================================================================
// Additional error path tests
// =============================================================================

Deno.test("XmlTokenizer.process() throws on < in single-quoted attribute value", () => {
  assertThrows(
    () => collectTokens("<root attr='<'/>"),
    XmlSyntaxError,
    "'<' not allowed in attribute value",
  );
});

Deno.test("XmlTokenizer.process() throws on invalid character in end tag", () => {
  assertThrows(
    () => collectTokens("<root></@>"),
    XmlSyntaxError,
    "Unexpected character",
  );
});

Deno.test("XmlTokenizer.process() throws on expected > after / in self-closing", () => {
  assertThrows(
    () => collectTokens("<item/ >"),
    XmlSyntaxError,
    "Expected '>' after '/'",
  );
});

// =============================================================================
// Comment edge case tests (-- handling)
// =============================================================================

Deno.test("XmlTokenizer.process() throws on -- not followed by > in comment", () => {
  assertThrows(
    () => collectTokens("<r><!--a--b--></r>"),
    XmlSyntaxError,
    "'--' is not permitted within comments",
  );
});

Deno.test("XmlTokenizer.process() throws on -- at chunk boundary in comment", () => {
  assertThrows(
    () => collectChunkedTokens("<r><!--a-", "-b--></r>"),
    XmlSyntaxError,
    "'--' is not permitted within comments",
  );
});

Deno.test("XmlTokenizer.process() rejects single - before --> in comment", () => {
  // XML 1.0 §2.5: Comment grammar requires every '-' to be followed by a non-dash
  // character, so a '-' immediately before '-->' is invalid
  assertThrows(
    () => collectChunkedTokens("<r><!--test-", "--></r>"),
    XmlSyntaxError,
    "'-' is not permitted immediately before '-->'",
  );
});

// =============================================================================
// CDATA edge case tests (] and ]] handling)
// =============================================================================

Deno.test("XmlTokenizer.process() handles ] not followed by ]> in CDATA", () => {
  const tokens = collectTokens("<r><![CDATA[a]b]]></r>");
  const cdata = tokens.find((t) => t.type === "cdata");
  assertEquals(cdata?.content, "a]b");
});

Deno.test("XmlTokenizer.process() handles ]] not followed by > in CDATA", () => {
  const tokens = collectTokens("<r><![CDATA[a]]b]]></r>");
  const cdata = tokens.find((t) => t.type === "cdata");
  assertEquals(cdata?.content, "a]]b");
});

Deno.test("XmlTokenizer.process() handles ] at chunk boundary in CDATA", () => {
  const tokens = collectChunkedTokens("<r><![CDATA[a]", "b]]></r>");
  const cdata = tokens.find((t) => t.type === "cdata");
  assertEquals(cdata?.content, "a]b");
});

Deno.test("XmlTokenizer.process() handles ]] at chunk boundary not followed by >", () => {
  const tokens = collectChunkedTokens("<r><![CDATA[a]]", "b]]></r>");
  const cdata = tokens.find((t) => t.type === "cdata");
  assertEquals(cdata?.content, "a]]b");
});

// =============================================================================
// PI edge case tests (? handling)
// =============================================================================

Deno.test("XmlTokenizer.process() handles ? not followed by > in PI", () => {
  const tokens = collectTokens("<?php echo '?'; ?><root/>");
  const pi = tokens.find((t) => t.type === "processing_instruction");
  assertEquals(pi?.content, "echo '?';");
});

Deno.test("XmlTokenizer.process() handles multiple ? in PI content", () => {
  const tokens = collectTokens("<?php ??? ?><root/>");
  const pi = tokens.find((t) => t.type === "processing_instruction");
  assertEquals(pi?.content, "???");
});

Deno.test("XmlTokenizer.process() handles ? at chunk boundary in PI", () => {
  const tokens = collectChunkedTokens("<?php test?", " more?><root/>");
  const pi = tokens.find((t) => t.type === "processing_instruction");
  assertEquals(pi?.content, "test? more");
});

Deno.test("XmlTokenizer.process() handles empty PI target with immediate ?>", () => {
  // This tests the PI_AFTER_TARGET state with immediate close
  const tokens = collectTokens("<?x?><root/>");
  const pi = tokens.find((t) => t.type === "processing_instruction");
  assertEquals(pi?.target, "x");
  assertEquals(pi?.content, "");
});

// =============================================================================
// DOCTYPE edge case tests
// =============================================================================

Deno.test("XmlTokenizer.process() handles DOCTYPE with PUBLIC ID only (no SYSTEM)", () => {
  const tokens = collectTokens(
    '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN"><html></html>',
  );
  assertEquals(tokens[0]?.type, "doctype");
  assertEquals(tokens[0]?.publicId, "-//W3C//DTD HTML 4.01//EN");
  assertEquals(tokens[0]?.systemId, undefined);
});

Deno.test("XmlTokenizer.process() handles DOCTYPE with internal subset bracket", () => {
  const tokens = collectTokens(
    "<!DOCTYPE root [<!ENTITY test 'value'>]><root/>",
  );
  assertEquals(tokens[0]?.type, "doctype");
  assertEquals(tokens[0]?.name, "root");
});

// =============================================================================
// Additional error path tests
// =============================================================================

Deno.test("XmlTokenizer.process() throws on unexpected char after tag name", () => {
  assertThrows(
    () => collectTokens("<root@/>"),
    XmlSyntaxError,
    "Unexpected character",
  );
});

Deno.test("XmlTokenizer.process() throws on unexpected char in attribute name", () => {
  assertThrows(
    () => collectTokens("<root attr@='val'/>"),
    XmlSyntaxError,
    "Unexpected character",
  );
});

Deno.test("XmlTokenizer.process() throws on invalid DOCTYPE spelling", () => {
  assertThrows(
    () => collectTokens("<!DOCTYPO root><root/>"),
    XmlSyntaxError,
    "Expected DOCTYPE",
  );
});

Deno.test("XmlTokenizer.process() throws on invalid CDATA start", () => {
  assertThrows(
    () => collectTokens("<root><![CDATX[test]]></root>"),
    XmlSyntaxError,
    "Expected 'CDATA['",
  );
});

Deno.test("XmlTokenizer.process() throws on missing second - to start comment", () => {
  assertThrows(
    () => collectTokens("<root><!-x></root>"),
    XmlSyntaxError,
    "Expected '-' to start comment",
  );
});

Deno.test("XmlTokenizer.process() throws on unexpected char in end tag after whitespace", () => {
  assertThrows(
    () => collectTokens("<root></root @>"),
    XmlSyntaxError,
    "Unexpected character",
  );
});

Deno.test("XmlTokenizer.process() throws on invalid PUBLIC spelling", () => {
  // "PUBLIX" doesn't start with "PUBLIC" after 5 chars
  assertThrows(
    () => collectTokens('<!DOCTYPE html PUBLIX "-//W3C//"><html/>'),
    XmlSyntaxError,
    "Expected PUBLIC",
  );
});

Deno.test("XmlTokenizer.process() throws on invalid char in PI target", () => {
  assertThrows(
    () => collectTokens("<?tar@get ?><root/>"),
    XmlSyntaxError,
    "Unexpected character",
  );
});

Deno.test("XmlTokenizer.process() throws on expected > after ? in PI target", () => {
  // PI with ? immediately after target, followed by non->
  assertThrows(
    () => collectTokens("<?x?y><root/>"),
    XmlSyntaxError,
    "Expected '>' after '?'",
  );
});

// =============================================================================
// Additional edge cases for higher coverage
// =============================================================================

Deno.test("XmlTokenizer.process() rejects XML declaration without version", () => {
  // XML 1.0 §2.8: version is required in XML declaration
  assertThrows(
    () => collectTokens("<?xml?><root/>"),
    XmlSyntaxError,
    "Missing required 'version' attribute",
  );
});

Deno.test("XmlTokenizer.process() handles ]]] sequence in CDATA", () => {
  // Tests CDATA with consecutive ] characters where one starts new close attempt
  const tokens = collectTokens("<r><![CDATA[a]]]></r>");
  const cdata = tokens.find((t) => t.type === "cdata");
  assertEquals(cdata?.content, "a]");
});

Deno.test("XmlTokenizer.process() handles PI with ?? followed by >", () => {
  // Tests consecutive ? in PI content
  const tokens = collectTokens("<?php test??><root/>");
  const pi = tokens.find((t) => t.type === "processing_instruction");
  assertEquals(pi?.content, "test?");
});

Deno.test("XmlTokenizer.process() throws on unsupported markup <!ENTITY", () => {
  assertThrows(
    () => collectTokens("<root><!ENTITY test 'value'></root>"),
    XmlSyntaxError,
    "Unsupported markup declaration",
  );
});

Deno.test("XmlTokenizer.process() handles DOCTYPE with direct internal subset", () => {
  // DOCTYPE that goes directly to internal subset via [
  const tokens = collectTokens("<!DOCTYPE root[<!ENTITY x 'y'>]><root/>");
  assertEquals(tokens[0]?.type, "doctype");
  assertEquals(tokens[0]?.name, "root");
});

Deno.test("XmlTokenizer.process() handles comment - at chunk boundary followed by non-dash", () => {
  // Single - at chunk boundary, next char is not -
  const tokens = collectChunkedTokens("<r><!-", "- test --></r>");
  const comment = tokens.find((t) => t.type === "comment");
  assertEquals(comment?.content, " test ");
});

Deno.test("XmlTokenizer.process() handles multiline comment for position tracking", () => {
  // Multi-line content to hit #updatePositionForRegion newline tracking
  const tokens = collectTokens("<r><!--\nline2\nline3--></r>");
  const comment = tokens.find((t) => t.type === "comment");
  assertEquals(comment?.content, "\nline2\nline3");
});

Deno.test("XmlTokenizer.process() handles multiline CDATA for position tracking", () => {
  const tokens = collectTokens("<r><![CDATA[\nline2\nline3]]></r>");
  const cdata = tokens.find((t) => t.type === "cdata");
  assertEquals(cdata?.content, "\nline2\nline3");
});

Deno.test("XmlTokenizer.process() handles multiline PI for position tracking", () => {
  const tokens = collectTokens("<?php\nline2\nline3?><root/>");
  const pi = tokens.find((t) => t.type === "processing_instruction");
  assertEquals(pi?.content, "line2\nline3");
});

// =============================================================================
// Additional Coverage Tests - Streaming Edge Cases
// =============================================================================

Deno.test("XmlTokenizer.process() handles attribute name split across chunks", () => {
  // Tests partial attribute name handling at buffer boundary
  const tokens = collectChunkedTokens("<root attr", 'ibute="value"/>');
  const attr = tokens.find((t) => t.type === "attribute");
  assertEquals(attr?.name, "attribute");
  assertEquals(attr?.value, "value");
});

Deno.test("XmlTokenizer.process() handles single dash in comment content", () => {
  // Tests COMMENT state handling single dash followed by non-dash
  const tokens = collectTokens("<root><!-- a-b-c --></root>");
  const comment = tokens.find((t) => t.type === "comment");
  assertEquals(comment?.content, " a-b-c ");
});

Deno.test("XmlTokenizer.process() handles dash at end of comment content chunk", () => {
  // Tests COMMENT_DASH state: dash followed by non-dash char
  const tokens = collectChunkedTokens("<root><!--test-", "x--></root>");
  const comment = tokens.find((t) => t.type === "comment");
  assertEquals(comment?.content, "test-x");
});

Deno.test("XmlTokenizer.process() handles declaration with single-quoted standalone", () => {
  // Tests single quote variants in declaration parsing
  const tokens = collectTokens("<?xml version='1.0' standalone='yes'?><root/>");
  const decl = tokens.find((t) => t.type === "declaration");
  assertEquals(decl?.version, "1.0");
  assertEquals(decl?.standalone, "yes");
});

Deno.test("XmlTokenizer.process() handles declaration with single-quoted encoding", () => {
  const tokens = collectTokens(
    "<?xml version='1.0' encoding='ISO-8859-1'?><root/>",
  );
  const decl = tokens.find((t) => t.type === "declaration");
  assertEquals(decl?.encoding, "ISO-8859-1");
});

// =============================================================================
// Additional Coverage Tests - Error Paths
// =============================================================================

Deno.test("XmlTokenizer.process() throws on unexpected char in end tag", () => {
  // Tests error path in END_TAG_NAME state for invalid characters
  assertThrows(
    () => collectTokens("<root></root@>"),
    XmlSyntaxError,
    "Unexpected character",
  );
});

Deno.test("XmlTokenizer.process() throws on unexpected char after tag name", () => {
  // Tests error path in AFTER_TAG_NAME state
  assertThrows(
    () => collectTokens("<root @/>"),
    XmlSyntaxError,
    "Unexpected character",
  );
});

Deno.test("XmlTokenizer.process() throws on invalid char after attribute name whitespace", () => {
  // Tests AFTER_ATTRIBUTE_NAME error path - whitespace then invalid char
  assertThrows(
    () => collectTokens("<root attr @/>"),
    XmlSyntaxError,
    "Expected '=' after attribute name",
  );
});

Deno.test("XmlTokenizer.process() throws on unexpected char after <", () => {
  // Tests OPEN_TAG state error for invalid start character
  assertThrows(
    () => collectTokens("<root><@invalid/></root>"),
    XmlSyntaxError,
    "Unexpected character",
  );
});

// =============================================================================
// Additional Coverage Tests - CDATA and PI edge cases
// =============================================================================

Deno.test("XmlTokenizer.process() handles ] at chunk boundary in CDATA", () => {
  // Tests CDATA state handling single ] followed by non-] character
  const tokens = collectChunkedTokens("<r><![CDATA[test]", "x]]></r>");
  const cdata = tokens.find((t) => t.type === "cdata");
  assertEquals(cdata?.content, "test]x");
});

Deno.test("XmlTokenizer.process() handles ? at chunk boundary in PI", () => {
  // Tests PI_CONTENT state handling ? followed by non-> character
  const tokens = collectChunkedTokens("<?php test?", "x?><r/>");
  const pi = tokens.find((t) => t.type === "processing_instruction");
  assertEquals(pi?.content, "test?x");
});

// =============================================================================
// DTD Comment Tests (DOCTYPE Internal Subset)
// =============================================================================

Deno.test("XmlTokenizer.process() handles comment inside DOCTYPE internal subset", () => {
  // Tests DTD_COMMENT_START, DTD_COMMENT, DTD_COMMENT_DASH, DTD_COMMENT_DASH_DASH states
  const tokens = collectTokens(
    "<!DOCTYPE root [<!-- DTD comment -->]><root/>",
  );
  assertEquals(tokens[0]?.type, "doctype");
  assertEquals(tokens[1]?.type, "start_tag_open");
});

Deno.test("XmlTokenizer.process() handles comment with dashes inside DOCTYPE internal subset", () => {
  // Tests DTD_COMMENT_DASH state (dash followed by non-dash)
  const tokens = collectTokens(
    "<!DOCTYPE root [<!-- a-b-c -->]><root/>",
  );
  assertEquals(tokens[0]?.type, "doctype");
});

Deno.test("XmlTokenizer.process() throws on multiple trailing dashes in DOCTYPE comment", () => {
  // Per XML 1.0 §2.5, after '--' only '>' is permitted.
  // '<!------>' has content '--' which contains the forbidden '--' sequence.
  assertThrows(
    () => collectTokens("<!DOCTYPE root [<!------>]><root/>"),
    XmlSyntaxError,
    "'--' is not allowed within XML comments",
  );
});

Deno.test("XmlTokenizer.process() throws on -- in comment inside DOCTYPE", () => {
  // Tests DTD_COMMENT_DASH_DASH error path
  assertThrows(
    () => collectTokens("<!DOCTYPE root [<!-- a--b -->]><root/>"),
    XmlSyntaxError,
    "'--' is not allowed within XML comments",
  );
});

Deno.test("XmlTokenizer.finalize() throws on unterminated comment in DOCTYPE", () => {
  const tokenizer = new XmlTokenizer();
  const { callbacks } = createCollector();
  tokenizer.process("<!DOCTYPE root [<!-- unterminated", callbacks);
  assertThrows(
    () => tokenizer.finalize(callbacks),
    XmlSyntaxError,
    "Unterminated comment in DOCTYPE",
  );
});

// =============================================================================
// DTD Processing Instruction Tests (DOCTYPE Internal Subset)
// =============================================================================

Deno.test("XmlTokenizer.process() handles PI inside DOCTYPE internal subset", () => {
  // Tests DTD_PI and DTD_PI_QUESTION states
  const tokens = collectTokens(
    "<!DOCTYPE root [<?target content?>]><root/>",
  );
  assertEquals(tokens[0]?.type, "doctype");
  assertEquals(tokens[1]?.type, "start_tag_open");
});

Deno.test("XmlTokenizer.process() handles PI with ? inside DOCTYPE internal subset", () => {
  // Tests DTD_PI_QUESTION with ? followed by non->
  const tokens = collectTokens(
    "<!DOCTYPE root [<?target test?content?>]><root/>",
  );
  assertEquals(tokens[0]?.type, "doctype");
});

Deno.test("XmlTokenizer.process() handles PI with multiple ? in DOCTYPE internal subset", () => {
  // Tests DTD_PI_QUESTION staying in state for consecutive ?
  const tokens = collectTokens(
    "<!DOCTYPE root [<?target ????>]><root/>",
  );
  assertEquals(tokens[0]?.type, "doctype");
});

Deno.test("XmlTokenizer.finalize() throws on unterminated PI in DOCTYPE", () => {
  const tokenizer = new XmlTokenizer();
  const { callbacks } = createCollector();
  tokenizer.process("<!DOCTYPE root [<?target unterminated", callbacks);
  assertThrows(
    () => tokenizer.finalize(callbacks),
    XmlSyntaxError,
    "Unterminated processing instruction in DOCTYPE",
  );
});

// =============================================================================
// DTD Parameter Entity Reference Tests (DOCTYPE Internal Subset)
// =============================================================================

Deno.test("XmlTokenizer.process() handles parameter entity reference in DOCTYPE", () => {
  // Tests DTD_PE_REF state
  const tokens = collectTokens(
    "<!DOCTYPE root [%entity;]><root/>",
  );
  assertEquals(tokens[0]?.type, "doctype");
  assertEquals(tokens[1]?.type, "start_tag_open");
});

Deno.test("XmlTokenizer.process() handles parameter entity with long name in DOCTYPE", () => {
  // Tests DTD_PE_REF state with multiple name characters
  const tokens = collectTokens(
    "<!DOCTYPE root [%longEntityName123;]><root/>",
  );
  assertEquals(tokens[0]?.type, "doctype");
});

Deno.test("XmlTokenizer.process() throws on invalid char in parameter entity reference", () => {
  assertThrows(
    () => collectTokens("<!DOCTYPE root [%entity@;]><root/>"),
    XmlSyntaxError,
    "Invalid character in parameter entity reference",
  );
});

Deno.test("XmlTokenizer.finalize() throws on unterminated parameter entity reference", () => {
  const tokenizer = new XmlTokenizer();
  const { callbacks } = createCollector();
  tokenizer.process("<!DOCTYPE root [%entity", callbacks);
  assertThrows(
    () => tokenizer.finalize(callbacks),
    XmlSyntaxError,
    "Unterminated parameter entity reference in DOCTYPE",
  );
});

// =============================================================================
// DTD Internal Subset Chunk Boundary Tests
// =============================================================================

Deno.test("XmlTokenizer.process() handles comment across chunks in DOCTYPE", () => {
  const tokens = collectChunkedTokens(
    "<!DOCTYPE root [<!-",
    "- comment -->]><root/>",
  );
  assertEquals(tokens[0]?.type, "doctype");
});

Deno.test("XmlTokenizer.process() handles PI across chunks in DOCTYPE", () => {
  const tokens = collectChunkedTokens(
    "<!DOCTYPE root [<?tar",
    "get content?>]><root/>",
  );
  assertEquals(tokens[0]?.type, "doctype");
});

// =============================================================================
// Illegal XML Character Validation Tests (XML 1.0 §2.2)
// =============================================================================

Deno.test("XmlTokenizer.process() throws on NUL character in text content", () => {
  assertThrows(
    () => collectTokens("<root>test\x00value</root>"),
    XmlSyntaxError,
    "Illegal XML character U+0000",
  );
});

Deno.test("XmlTokenizer.process() throws on control character in text content", () => {
  // U+0001 (SOH) is illegal in XML 1.0
  assertThrows(
    () => collectTokens("<root>test\x01value</root>"),
    XmlSyntaxError,
    "Illegal XML character U+0001",
  );
});

Deno.test("XmlTokenizer.process() throws on illegal character in CDATA section", () => {
  assertThrows(
    () => collectTokens("<r><![CDATA[test\x02value]]></r>"),
    XmlSyntaxError,
    "Illegal XML character U+0002",
  );
});

Deno.test("XmlTokenizer.process() throws on illegal character in comment", () => {
  assertThrows(
    () => collectTokens("<r><!--test\x03value--></r>"),
    XmlSyntaxError,
    "Illegal XML character U+0003",
  );
});

Deno.test("XmlTokenizer.process() throws on illegal character in PI content", () => {
  assertThrows(
    () => collectTokens("<?php test\x04value?><r/>"),
    XmlSyntaxError,
    "Illegal XML character U+0004",
  );
});

Deno.test("XmlTokenizer.process() allows TAB, LF, CR in text content", () => {
  // These are the only valid C0 control characters
  const tokens = collectTokens("<root>tab:\there\nline\rend</root>");
  const text = tokens.find((t) => t.type === "text");
  // CR is normalized to LF
  assertEquals(text?.content, "tab:\there\nline\nend");
});

// =============================================================================
// Text Content ]]> Prohibition Tests (XML 1.0 §2.4)
// =============================================================================

Deno.test("XmlTokenizer.process() throws on ]]> in text content", () => {
  assertThrows(
    () => collectTokens("<root>invalid ]]> here</root>"),
    XmlSyntaxError,
    "']]>' is not allowed in text content",
  );
});

Deno.test("XmlTokenizer.process() allows ]] followed by non-> in text", () => {
  // ]] followed by non-> character is fine
  const tokens = collectTokens("<root>test ]] here</root>");
  const text = tokens.find((t) => t.type === "text");
  assertEquals(text?.content, "test ]] here");
});

Deno.test("XmlTokenizer.process() allows ] and ] separately in text", () => {
  const tokens = collectTokens("<root>brackets ] and ] here</root>");
  const text = tokens.find((t) => t.type === "text");
  assertEquals(text?.content, "brackets ] and ] here");
});

// =============================================================================
// Whitespace Between Attributes Tests (XML 1.0 §3.1)
// =============================================================================

Deno.test("XmlTokenizer.process() throws on missing whitespace between attributes", () => {
  assertThrows(
    () => collectTokens('<root a="1"b="2"/>'),
    XmlSyntaxError,
    "Whitespace is required between attributes",
  );
});

Deno.test("XmlTokenizer.process() handles multiple attributes with proper whitespace", () => {
  const tokens = collectTokens('<root a="1" b="2" c="3"/>');
  const attrs = tokens.filter(isTokenType("attribute"));
  assertEquals(attrs.length, 3);
  assertEquals(attrs[0]?.value, "1");
  assertEquals(attrs[1]?.value, "2");
  assertEquals(attrs[2]?.value, "3");
});

// =============================================================================
// XML Declaration Validation Edge Cases
// =============================================================================

Deno.test("XmlTokenizer.process() throws on uppercase VERSION in declaration", () => {
  assertThrows(
    () => collectTokens('<?xml VERSION="1.0"?><root/>'),
    XmlSyntaxError,
    "'VERSION' must be lowercase",
  );
});

Deno.test("XmlTokenizer.process() throws on uppercase ENCODING in declaration", () => {
  assertThrows(
    () => collectTokens('<?xml version="1.0" ENCODING="UTF-8"?><root/>'),
    XmlSyntaxError,
    "'ENCODING' must be lowercase",
  );
});

Deno.test("XmlTokenizer.process() throws on uppercase STANDALONE in declaration", () => {
  assertThrows(
    () => collectTokens('<?xml version="1.0" STANDALONE="yes"?><root/>'),
    XmlSyntaxError,
    "'STANDALONE' must be lowercase",
  );
});

Deno.test("XmlTokenizer.process() throws on invalid version number", () => {
  assertThrows(
    () => collectTokens('<?xml version="2.0"?><root/>'),
    XmlSyntaxError,
    "Invalid version",
  );
});

Deno.test("XmlTokenizer.process() throws on version not starting with 1.", () => {
  assertThrows(
    () => collectTokens('<?xml version="0.9"?><root/>'),
    XmlSyntaxError,
    "Invalid version",
  );
});

Deno.test("XmlTokenizer.process() throws on invalid encoding name starting with digit", () => {
  assertThrows(
    () => collectTokens('<?xml version="1.0" encoding="8859-1"?><root/>'),
    XmlSyntaxError,
    "Invalid encoding name",
  );
});

Deno.test("XmlTokenizer.process() throws on invalid standalone value", () => {
  assertThrows(
    () => collectTokens('<?xml version="1.0" standalone="true"?><root/>'),
    XmlSyntaxError,
    "Invalid standalone value",
  );
});

Deno.test("XmlTokenizer.process() throws on duplicate version attribute", () => {
  assertThrows(
    () => collectTokens('<?xml version="1.0" version="1.1"?><root/>'),
    XmlSyntaxError,
    "Duplicate 'version' attribute",
  );
});

Deno.test("XmlTokenizer.process() throws on standalone before encoding", () => {
  assertThrows(
    () =>
      collectTokens(
        '<?xml version="1.0" standalone="yes" encoding="UTF-8"?><root/>',
      ),
    XmlSyntaxError,
    "'encoding' must come before 'standalone'",
  );
});

Deno.test("XmlTokenizer.process() throws on XML declaration after content", () => {
  // Text before XML declaration
  assertThrows(
    () => collectTokens('  <?xml version="1.0"?><root/>'),
    XmlSyntaxError,
    "XML declaration must appear at the start",
  );
});

Deno.test("XmlTokenizer.process() throws on XML declaration after comment", () => {
  assertThrows(
    () => collectTokens('<!-- comment --><?xml version="1.0"?><root/>'),
    XmlSyntaxError,
    "XML declaration must appear at the start",
  );
});

Deno.test("XmlTokenizer.process() throws on unknown attribute in declaration", () => {
  assertThrows(
    () => collectTokens('<?xml version="1.0" foo="bar"?><root/>'),
    XmlSyntaxError,
    "Unknown attribute 'foo'",
  );
});

Deno.test("XmlTokenizer.process() throws on missing whitespace between declaration attrs", () => {
  assertThrows(
    () => collectTokens('<?xml version="1.0"encoding="UTF-8"?><root/>'),
    XmlSyntaxError,
    "Missing whitespace between attributes",
  );
});

// =============================================================================
// DOCTYPE Case Sensitivity Tests
// =============================================================================

Deno.test("XmlTokenizer.process() throws on lowercase 'public' in DOCTYPE", () => {
  assertThrows(
    () => collectTokens('<!DOCTYPE html public "-//W3C//"><html/>'),
    XmlSyntaxError,
    "must be uppercase 'PUBLIC'",
  );
});

Deno.test("XmlTokenizer.process() throws on lowercase 'system' in DOCTYPE", () => {
  assertThrows(
    () => collectTokens('<!DOCTYPE html system "test.dtd"><html/>'),
    XmlSyntaxError,
    "must be uppercase 'SYSTEM'",
  );
});

Deno.test("XmlTokenizer.process() throws on invalid SYSTEM keyword spelling", () => {
  assertThrows(
    () => collectTokens('<!DOCTYPE html SYSTEX "test.dtd"><html/>'),
    XmlSyntaxError,
    "Expected SYSTEM",
  );
});

// =============================================================================
// PubidLiteral Validation Tests
// =============================================================================

Deno.test("XmlTokenizer.process() throws on invalid character in PUBLIC ID", () => {
  // Character < is not valid in PubidLiteral
  assertThrows(
    () =>
      collectTokens(
        '<!DOCTYPE html PUBLIC "invalid<char" "http://example.com/"><html/>',
      ),
    XmlSyntaxError,
    "Invalid character",
  );
});

Deno.test("XmlTokenizer.process() allows valid PubidChar characters", () => {
  // Valid: a-zA-Z0-9 and special chars -'()+,./:=?;!*#@$_%
  const tokens = collectTokens(
    '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd"><html/>',
  );
  assertEquals(tokens[0]?.type, "doctype");
  assertEquals(tokens[0]?.publicId, "-//W3C//DTD HTML 4.01//EN");
});

// =============================================================================
// DTD Internal Subset Tests
// =============================================================================

Deno.test("XmlTokenizer.process() throws on conditional sections in internal subset", () => {
  // Bare [ in internal subset indicates conditional section (only allowed in external subset)
  assertThrows(
    () => collectTokens("<!DOCTYPE root [ [ ]><root/>"),
    XmlSyntaxError,
    "Conditional sections",
  );
});

Deno.test("XmlTokenizer.process() handles DTD ELEMENT declaration", () => {
  const tokens = collectTokens(
    "<!DOCTYPE root [<!ELEMENT root (#PCDATA)>]><root/>",
  );
  assertEquals(tokens[0]?.type, "doctype");
});

Deno.test("XmlTokenizer.process() handles DTD ATTLIST declaration", () => {
  const tokens = collectTokens(
    "<!DOCTYPE root [<!ATTLIST root id ID #IMPLIED>]><root/>",
  );
  assertEquals(tokens[0]?.type, "doctype");
});

Deno.test("XmlTokenizer.process() handles DTD NOTATION declaration", () => {
  const tokens = collectTokens(
    '<!DOCTYPE root [<!NOTATION gif SYSTEM "image/gif">]><root/>',
  );
  assertEquals(tokens[0]?.type, "doctype");
});

Deno.test("XmlTokenizer.process() throws on unknown DTD declaration", () => {
  assertThrows(
    () => collectTokens("<!DOCTYPE root [<!UNKNOWN test>]><root/>"),
    XmlSyntaxError,
    "Unknown declaration type",
  );
});

// =============================================================================
// ENTITY Declaration Validation Tests
// =============================================================================

Deno.test("XmlTokenizer.process() throws on parameter entity with NDATA", () => {
  // Parameter entities cannot have NDATA declarations
  assertThrows(
    () =>
      collectTokens(
        '<!DOCTYPE root [<!ENTITY % pe SYSTEM "file.txt" NDATA notation>]><root/>',
      ),
    XmlSyntaxError,
    "Parameter entities cannot have NDATA",
  );
});

Deno.test("XmlTokenizer.process() throws on duplicate SYSTEM keyword", () => {
  assertThrows(
    () =>
      collectTokens(
        '<!DOCTYPE root [<!ENTITY e SYSTEM "a.txt" SYSTEM "b.txt">]><root/>',
      ),
    XmlSyntaxError,
    "Duplicate external ID keyword",
  );
});

Deno.test("XmlTokenizer.process() throws on lowercase 'system' in ENTITY", () => {
  assertThrows(
    () =>
      collectTokens('<!DOCTYPE root [<!ENTITY e system "file.txt">]><root/>'),
    XmlSyntaxError,
    "must be uppercase 'SYSTEM'",
  );
});

Deno.test("XmlTokenizer.process() throws on lowercase 'public' in ENTITY", () => {
  assertThrows(
    () =>
      collectTokens(
        '<!DOCTYPE root [<!ENTITY e public "-//W3C//" "file.dtd">]><root/>',
      ),
    XmlSyntaxError,
    "must be uppercase 'PUBLIC'",
  );
});

Deno.test("XmlTokenizer.process() throws on lowercase 'ndata' in ENTITY", () => {
  assertThrows(
    () =>
      collectTokens(
        '<!DOCTYPE root [<!ENTITY e SYSTEM "file.bin" ndata notation>]><root/>',
      ),
    XmlSyntaxError,
    "must be uppercase 'NDATA'",
  );
});

Deno.test("XmlTokenizer.process() throws on PUBLIC without system ID", () => {
  assertThrows(
    () =>
      collectTokens('<!DOCTYPE root [<!ENTITY e PUBLIC "-//W3C//">]><root/>'),
    XmlSyntaxError,
    "PUBLIC identifier requires both public ID and system ID",
  );
});

// =============================================================================
// Empty PI Target Test
// =============================================================================

Deno.test("XmlTokenizer.process() throws on empty PI target", () => {
  assertThrows(
    () => collectTokens("<? ?><root/>"),
    XmlSyntaxError,
    "Processing instruction target is required",
  );
});

Deno.test("XmlTokenizer.process() throws on PI target starting with invalid char", () => {
  assertThrows(
    () => collectTokens("<?123target?><root/>"),
    XmlSyntaxError,
    "Invalid character",
  );
});

// =============================================================================
// Astral Plane Character Tests (Surrogate Pairs)
// =============================================================================

Deno.test("XmlTokenizer.process() handles astral plane characters in element content", () => {
  // U+1F600 (😀) encoded as surrogate pair \uD83D\uDE00
  const tokens = collectTokens("<root>Hello \u{1F600} World</root>");
  const text = tokens.find((t) => t.type === "text");
  assertEquals(text?.content, "Hello 😀 World");
});

Deno.test("XmlTokenizer.process() handles astral plane character in attribute value", () => {
  const tokens = collectTokens('<root attr="test \u{1F600} value"/>');
  const attr = tokens.find((t) => t.type === "attribute");
  assertEquals(attr?.value, "test 😀 value");
});

Deno.test("XmlTokenizer.process() handles CJK Extension B characters in element name", () => {
  // U+20000 is a valid NameStartChar (CJK Unified Ideographs Extension B)
  const tokens = collectTokens("<\u{20000}></\u{20000}>");
  assertEquals(tokens[0]?.name, "𠀀");
  assertEquals(tokens[2]?.name, "𠀀");
});

// =============================================================================
// Finalize Error Path Coverage Tests
// =============================================================================

Deno.test("XmlTokenizer.finalize() throws for markup declaration without type", () => {
  const tokenizer = new XmlTokenizer();
  const { callbacks } = createCollector();
  tokenizer.process("<root><!", callbacks);
  assertThrows(
    () => tokenizer.finalize(callbacks),
    XmlSyntaxError,
    "Unexpected end of input in markup declaration",
  );
});

Deno.test("XmlTokenizer.finalize() throws for unclosed end tag", () => {
  const tokenizer = new XmlTokenizer();
  const { callbacks } = createCollector();
  tokenizer.process("<root></root", callbacks);
  assertThrows(
    () => tokenizer.finalize(callbacks),
    XmlSyntaxError,
    "Unexpected end of input in end tag",
  );
});

Deno.test("XmlTokenizer.finalize() throws for DTD declaration keyword", () => {
  const tokenizer = new XmlTokenizer();
  const { callbacks } = createCollector();
  tokenizer.process("<!DOCTYPE root [<!ENT", callbacks);
  assertThrows(
    () => tokenizer.finalize(callbacks),
    XmlSyntaxError,
    "Unterminated DOCTYPE",
  );
});

Deno.test("XmlTokenizer.finalize() throws for DTD string literal", () => {
  const tokenizer = new XmlTokenizer();
  const { callbacks } = createCollector();
  tokenizer.process('<!DOCTYPE root [<!ENTITY e "unterminated', callbacks);
  assertThrows(
    () => tokenizer.finalize(callbacks),
    XmlSyntaxError,
    "Unterminated DOCTYPE",
  );
});

// =============================================================================
// Complex DTD Declaration Tests
// =============================================================================

Deno.test("XmlTokenizer.process() handles ELEMENT declaration with content model operators", () => {
  // Test *, +, ? operators in content model
  const tokens = collectTokens(
    "<!DOCTYPE root [<!ELEMENT root (a, b*, c+, d?)>]><root/>",
  );
  assertEquals(tokens[0]?.type, "doctype");
});

Deno.test("XmlTokenizer.process() handles ELEMENT declaration with nested parentheses", () => {
  const tokens = collectTokens(
    "<!DOCTYPE root [<!ELEMENT root ((a|b), (c|d))>]><root/>",
  );
  assertEquals(tokens[0]?.type, "doctype");
});

Deno.test("XmlTokenizer.process() handles ATTLIST with #FIXED value", () => {
  const tokens = collectTokens(
    '<!DOCTYPE root [<!ATTLIST root type CDATA #FIXED "default">]><root/>',
  );
  assertEquals(tokens[0]?.type, "doctype");
});

Deno.test("XmlTokenizer.process() handles ENTITY with external identifier", () => {
  // ENTITY declaration with SYSTEM external identifier
  const tokens = collectTokens(
    '<!DOCTYPE root [<!ENTITY logo SYSTEM "images/logo.gif">]><root/>',
  );
  assertEquals(tokens[0]?.type, "doctype");
});

// =============================================================================
// Chunk Boundary Edge Cases for DTD
// =============================================================================

Deno.test("XmlTokenizer.process() handles ENTITY value across chunks", () => {
  const tokens = collectChunkedTokens(
    '<!DOCTYPE root [<!ENTITY greeting "Hel',
    'lo World">]><root/>',
  );
  assertEquals(tokens[0]?.type, "doctype");
});

Deno.test("XmlTokenizer.process() handles DTD declaration keyword across chunks", () => {
  const tokens = collectChunkedTokens(
    "<!DOCTYPE root [<!ELE",
    "MENT root (#PCDATA)>]><root/>",
  );
  assertEquals(tokens[0]?.type, "doctype");
});

// =============================================================================
// End Tag Name Chunk Boundary Tests
// =============================================================================

Deno.test("XmlTokenizer.process() handles end tag name split across chunks", () => {
  const tokens = collectChunkedTokens("<root></ro", "ot>");
  assertEquals(tokens[2]?.type, "end_tag");
  assertEquals(tokens[2]?.name, "root");
});

Deno.test("XmlTokenizer.process() handles end tag with whitespace across chunks", () => {
  const tokens = collectChunkedTokens("<root></root ", ">");
  assertEquals(tokens[2]?.type, "end_tag");
  assertEquals(tokens[2]?.name, "root");
});

// =============================================================================
// Attribute Value Quote Handling Tests
// =============================================================================

Deno.test("XmlTokenizer.process() handles double quote inside single-quoted attr", () => {
  const tokens = collectTokens("<root attr='say \"hello\"'/>");
  const attr = tokens.find((t) => t.type === "attribute");
  assertEquals(attr?.value, 'say "hello"');
});

Deno.test("XmlTokenizer.process() handles single quote inside double-quoted attr", () => {
  const tokens = collectTokens('<root attr="it\'s working"/>');
  const attr = tokens.find((t) => t.type === "attribute");
  assertEquals(attr?.value, "it's working");
});

// =============================================================================
// Position Tracking Disabled - Error Path Tests
// =============================================================================

Deno.test("XmlTokenizer with trackPosition: false still reports errors", () => {
  const tokenizer = new XmlTokenizer({ trackPosition: false });
  const { callbacks } = createCollector();
  // Trigger an error - position will be NO_POSITION (0, 0, 0)
  assertThrows(
    () => {
      tokenizer.process("<root>test\x00value</root>", callbacks);
    },
    XmlSyntaxError,
    "Illegal XML character",
  );
});

Deno.test("XmlTokenizer with trackPosition: false handles ]]> in text", () => {
  const tokenizer = new XmlTokenizer({ trackPosition: false });
  const { callbacks } = createCollector();
  assertThrows(
    () => {
      tokenizer.process("<root>test]]>value</root>", callbacks);
    },
    XmlSyntaxError,
    "']]>' is not allowed in text content",
  );
});

// =============================================================================
// Text Content Chunk Boundary Tests
// =============================================================================

Deno.test("XmlTokenizer.process() handles text content split across multiple chunks", () => {
  const tokens = collectChunkedTokens("<root>Hello ", "Wor", "ld</root>");
  const text = tokens.find((t) => t.type === "text");
  assertEquals(text?.content, "Hello World");
});

// =============================================================================
// Comment Edge Cases - Batch Capture Path
// =============================================================================

Deno.test("XmlTokenizer.process() throws on -- at chunk boundary forming double dash", () => {
  // Partial ends with -, new content starts with - = forms --
  assertThrows(
    () => collectChunkedTokens("<r><!--abc-", "-def--></r>"),
    XmlSyntaxError,
    "'--' is not permitted within comments",
  );
});

Deno.test("XmlTokenizer.process() throws on trailing dash in batch comment capture", () => {
  // The batch capture finds --> but content before it ends with -
  assertThrows(
    () => collectTokens("<r><!--test---></r>"),
    XmlSyntaxError,
    "'-' is not permitted immediately before '-->'",
  );
});

Deno.test("XmlTokenizer.process() handles long comment for batch capture", () => {
  // Long comment triggers batch capture path
  const longContent = "a".repeat(1000);
  const tokens = collectTokens(`<r><!--${longContent}--></r>`);
  const comment = tokens.find((t) => t.type === "comment");
  assertEquals(comment?.content, longContent);
});

Deno.test("XmlTokenizer.process() throws on -- in long comment batch capture", () => {
  // Double dash in the safe region of batch capture
  const prefix = "a".repeat(500);
  assertThrows(
    () => collectTokens(`<r><!--${prefix}--${prefix}--></r>`),
    XmlSyntaxError,
    "'--' is not permitted within comments",
  );
});

Deno.test("XmlTokenizer.process() throws on illegal char in batch comment capture", () => {
  // Illegal character in the safe region
  const prefix = "a".repeat(100);
  assertThrows(
    () => collectTokens(`<r><!--${prefix}\x05${prefix}--></r>`),
    XmlSyntaxError,
    "Illegal XML character",
  );
});

// =============================================================================
// PI Content Batch Capture Tests
// =============================================================================

Deno.test("XmlTokenizer.process() throws on illegal char in batch PI capture", () => {
  const prefix = "a".repeat(100);
  assertThrows(
    () => collectTokens(`<?php ${prefix}\x06${prefix}?><r/>`),
    XmlSyntaxError,
    "Illegal XML character",
  );
});

// =============================================================================
// DOCTYPE Edge Cases
// =============================================================================

Deno.test("XmlTokenizer.process() throws on missing quote for SYSTEM ID", () => {
  assertThrows(
    () => collectTokens("<!DOCTYPE root SYSTEM test.dtd><root/>"),
    XmlSyntaxError,
    "Expected quote to start system ID",
  );
});

Deno.test("XmlTokenizer.process() throws on unexpected char after PUBLIC ID", () => {
  assertThrows(
    () => collectTokens('<!DOCTYPE root PUBLIC "-//W3C//" @><root/>'),
    XmlSyntaxError,
    "Expected system ID or '>' after public ID",
  );
});

Deno.test("XmlTokenizer.process() throws on unexpected char in DOCTYPE internal subset", () => {
  assertThrows(
    () => collectTokens("<!DOCTYPE root [@]><root/>"),
    XmlSyntaxError,
    "Unexpected character",
  );
});

Deno.test("XmlTokenizer.process() throws on expected ! or ? after < in DTD", () => {
  assertThrows(
    () => collectTokens("<!DOCTYPE root [<x]><root/>"),
    XmlSyntaxError,
    "Expected '!' or '?'",
  );
});

Deno.test("XmlTokenizer.process() throws on incomplete comment start in DTD", () => {
  assertThrows(
    () => collectTokens("<!DOCTYPE root [<!-x]><root/>"),
    XmlSyntaxError,
    "Expected '-' after '<!-'",
  );
});

Deno.test("XmlTokenizer.process() throws on unexpected char in declaration keyword", () => {
  assertThrows(
    () => collectTokens("<!DOCTYPE root [<!ENT@ITY x 'y'>]><root/>"),
    XmlSyntaxError,
    "Unexpected character",
  );
});

// =============================================================================
// DTD Declaration Content Edge Cases
// =============================================================================

Deno.test("XmlTokenizer.process() throws on missing whitespace before quote in DTD", () => {
  assertThrows(
    () => collectTokens('<!DOCTYPE root [<!ENTITY e"value">]><root/>'),
    XmlSyntaxError,
    "Missing whitespace before quoted string",
  );
});

Deno.test("XmlTokenizer.process() throws on missing whitespace before paren in DTD", () => {
  assertThrows(
    () => collectTokens("<!DOCTYPE root [<!ELEMENT root(#PCDATA)>]><root/>"),
    XmlSyntaxError,
    "Missing whitespace before '('",
  );
});

Deno.test("XmlTokenizer.process() throws on unmatched closing paren in DTD", () => {
  assertThrows(
    () => collectTokens("<!DOCTYPE root [<!ELEMENT root )>]><root/>"),
    XmlSyntaxError,
    "Unexpected ')'",
  );
});

Deno.test("XmlTokenizer.process() handles brackets in DTD declaration", () => {
  // Square brackets are used in ATTLIST for enumerated types
  const tokens = collectTokens(
    '<!DOCTYPE root [<!ATTLIST root type (a|b) "a">]><root/>',
  );
  assertEquals(tokens[0]?.type, "doctype");
});

Deno.test("XmlTokenizer.process() handles pipe in DTD declaration", () => {
  // Pipe is used in content models for choice
  const tokens = collectTokens(
    "<!DOCTYPE root [<!ELEMENT root (a|b|c)>]><root/>",
  );
  assertEquals(tokens[0]?.type, "doctype");
});

Deno.test("XmlTokenizer.process() handles semicolon in DTD declaration", () => {
  // Semicolon ends entity references
  const tokens = collectTokens(
    "<!DOCTYPE root [<!ENTITY e '%other;'>]><root/>",
  );
  assertEquals(tokens[0]?.type, "doctype");
});

Deno.test("XmlTokenizer.process() handles hash in DTD declaration", () => {
  // Hash is used for #PCDATA, #IMPLIED, etc.
  const tokens = collectTokens(
    "<!DOCTYPE root [<!ATTLIST root attr CDATA #IMPLIED>]><root/>",
  );
  assertEquals(tokens[0]?.type, "doctype");
});

Deno.test("XmlTokenizer.process() throws on unexpected char in DTD declaration", () => {
  assertThrows(
    () => collectTokens("<!DOCTYPE root [<!ENTITY e ~value>]><root/>"),
    XmlSyntaxError,
    "Unexpected character",
  );
});

// =============================================================================
// ENTITY Declaration - PUBLIC with Both Literals
// =============================================================================

Deno.test("XmlTokenizer.process() handles ENTITY with PUBLIC external ID", () => {
  const tokens = collectTokens(
    '<!DOCTYPE root [<!ENTITY logo PUBLIC "-//W3C//" "http://example.com/logo.gif">]><root/>',
  );
  assertEquals(tokens[0]?.type, "doctype");
});

Deno.test("XmlTokenizer.process() throws on duplicate PUBLIC keyword in ENTITY", () => {
  assertThrows(
    () =>
      collectTokens(
        '<!DOCTYPE root [<!ENTITY e PUBLIC "-//W3C//" PUBLIC "-//Other//">]><root/>',
      ),
    XmlSyntaxError,
    "Duplicate external ID keyword",
  );
});

Deno.test("XmlTokenizer.process() throws on NDATA without external ID", () => {
  assertThrows(
    () =>
      collectTokens(
        '<!DOCTYPE root [<!ENTITY e "value" NDATA notation>]><root/>',
      ),
    XmlSyntaxError,
    "NDATA can only follow SYSTEM or PUBLIC",
  );
});

// =============================================================================
// Finalize Error Messages for Various States
// =============================================================================

Deno.test("XmlTokenizer.finalize() throws for PI target only", () => {
  const tokenizer = new XmlTokenizer();
  const { callbacks } = createCollector();
  tokenizer.process("<?target", callbacks);
  assertThrows(
    () => tokenizer.finalize(callbacks),
    XmlSyntaxError,
    "Unterminated processing instruction",
  );
});

Deno.test("XmlTokenizer.finalize() throws for PI target with ?", () => {
  const tokenizer = new XmlTokenizer();
  const { callbacks } = createCollector();
  tokenizer.process("<?x?", callbacks);
  assertThrows(
    () => tokenizer.finalize(callbacks),
    XmlSyntaxError,
    "Unterminated processing instruction",
  );
});

Deno.test("XmlTokenizer.finalize() throws for DOCTYPE name only", () => {
  const tokenizer = new XmlTokenizer();
  const { callbacks } = createCollector();
  tokenizer.process("<!DOCTYP", callbacks);
  assertThrows(
    () => tokenizer.finalize(callbacks),
    XmlSyntaxError,
    "Unterminated DOCTYPE",
  );
});

// =============================================================================
// Non-ASCII Name Characters Without Position Tracking
// =============================================================================

Deno.test("XmlTokenizer with trackPosition: false handles non-ASCII element names", () => {
  const tokenizer = new XmlTokenizer({ trackPosition: false });
  const { tokens, callbacks } = createCollector();
  tokenizer.process("<日本語></日本語>", callbacks);
  tokenizer.finalize(callbacks);
  assertEquals(tokens[0]?.name, "日本語");
});

Deno.test("XmlTokenizer with trackPosition: false handles astral plane names", () => {
  // CJK Extension B character U+20000
  const tokenizer = new XmlTokenizer({ trackPosition: false });
  const { tokens, callbacks } = createCollector();
  tokenizer.process("<\u{20000}></\u{20000}>", callbacks);
  tokenizer.finalize(callbacks);
  assertEquals(tokens[0]?.name, "𠀀");
});

// =============================================================================
// PubidLiteral Character Coverage
// =============================================================================

Deno.test("XmlTokenizer.process() allows all valid PubidChar in PUBLIC ID", () => {
  // Test various valid PubidChar: space, CR, LF, letters, digits, special chars
  const tokens = collectTokens(
    '<!DOCTYPE root PUBLIC "-//W3C//DTD (Test+1.0)/EN;!*#@$_%" "test.dtd"><root/>',
  );
  assertEquals(tokens[0]?.type, "doctype");
  assertEquals(tokens[0]?.publicId, "-//W3C//DTD (Test+1.0)/EN;!*#@$_%");
});

Deno.test("XmlTokenizer.process() allows single quote in double-quoted PUBLIC ID", () => {
  const tokens = collectTokens(
    '<!DOCTYPE root PUBLIC "-//W3C//It\'s a Test//EN" "test.dtd"><root/>',
  );
  assertEquals(tokens[0]?.publicId, "-//W3C//It's a Test//EN");
});

// =============================================================================
// Comment Boundary Edge Cases - Partial Ending with Dash
// =============================================================================

Deno.test("XmlTokenizer.process() handles comment where partial ends with dash", () => {
  // Chunk boundary splits comment so partial ends with - and new starts with non-dash
  const tokens = collectChunkedTokens("<r><!--test-", "abc--></r>");
  const comment = tokens.find((t) => t.type === "comment");
  assertEquals(comment?.content, "test-abc");
});

Deno.test("XmlTokenizer.process() handles trailing dash before --> across chunks", () => {
  // Tests line 891-902: partial ends with dash, new content is empty (just -->)
  assertThrows(
    () => collectChunkedTokens("<r><!--test-", "--></r>"),
    XmlSyntaxError,
    "'-' is not permitted immediately before '-->'",
  );
});

// =============================================================================
// CDATA Edge Cases - Char-by-Char Fallback
// =============================================================================

Deno.test("XmlTokenizer.process() handles CDATA with multiple ] in sequence", () => {
  // Tests CDATA_BRACKET_BRACKET with additional ] (line 1794-1798)
  const tokens = collectTokens("<r><![CDATA[test]]]></r>");
  const cdata = tokens.find((t) => t.type === "cdata");
  assertEquals(cdata?.content, "test]");
});

Deno.test("XmlTokenizer.process() handles CDATA char-by-char fallback for non-]", () => {
  // After batch capture, remaining char is not ] - tests line 1623-1625
  const tokens = collectChunkedTokens("<r><![CDATA[ab", "c]]></r>");
  const cdata = tokens.find((t) => t.type === "cdata");
  assertEquals(cdata?.content, "abc");
});

// =============================================================================
// PI Edge Cases - Char-by-Char and Multiple ?
// =============================================================================

Deno.test("XmlTokenizer.process() handles multiple ? in PI_QUESTION state", () => {
  // Tests line 1901-1904: consecutive ? in PI content
  const tokens = collectTokens("<?php echo ??? stuff?><r/>");
  const pi = tokens.find((t) => t.type === "processing_instruction");
  assertEquals(pi?.content, "echo ??? stuff");
});

Deno.test("XmlTokenizer.process() handles PI char-by-char fallback for non-?", () => {
  // After batch capture, remaining char is not ? - tests line 1657-1659
  const tokens = collectChunkedTokens("<?php ab", "c?><r/>");
  const pi = tokens.find((t) => t.type === "processing_instruction");
  assertEquals(pi?.content, "abc");
});

// =============================================================================
// Comment Char-by-Char Fallback
// =============================================================================

Deno.test("XmlTokenizer.process() handles comment char-by-char fallback for non-dash", () => {
  // After batch capture, remaining char is not - : tests line 1597-1599
  const tokens = collectChunkedTokens("<r><!--ab", "c--></r>");
  const comment = tokens.find((t) => t.type === "comment");
  assertEquals(comment?.content, "abc");
});

// =============================================================================
// AFTER_TAG_NAME State - Tag Closing Variants
// =============================================================================

Deno.test("XmlTokenizer.process() handles > immediately after attribute value", () => {
  // Tests AFTER_TAG_NAME with > (line 1395-1399)
  const tokens = collectTokens('<root attr="value">content</root>');
  assertEquals(tokens[0]?.type, "start_tag_open");
  assertEquals(tokens[1]?.type, "attribute");
  assertEquals(tokens[2]?.type, "start_tag_close");
  assertEquals(tokens[2]?.selfClosing, false);
});

Deno.test("XmlTokenizer.process() handles / immediately after attribute value", () => {
  // Tests AFTER_TAG_NAME with / (line 1400-1403) and self-closing
  const tokens = collectTokens('<root attr="value"/>');
  assertEquals(tokens[2]?.type, "start_tag_close");
  assertEquals(tokens[2]?.selfClosing, true);
});

// =============================================================================
// Attribute Value Edge Cases
// =============================================================================

Deno.test("XmlTokenizer.process() throws on missing quote for attribute value", () => {
  // Tests BEFORE_ATTRIBUTE_VALUE error (line 1507-1509)
  assertThrows(
    () => collectTokens("<root attr=value/>"),
    XmlSyntaxError,
    "Expected quote to start attribute value",
  );
});

Deno.test("XmlTokenizer.process() handles whitespace after attribute name before =", () => {
  // Tests AFTER_ATTRIBUTE_NAME whitespace handling (line 1514-1516)
  const tokens = collectTokens('<root attr  =  "value"/>');
  const attr = tokens.find((t) => t.type === "attribute");
  assertEquals(attr?.name, "attr");
  assertEquals(attr?.value, "value");
});

// =============================================================================
// DOCTYPE Name Edge Cases
// =============================================================================

Deno.test("XmlTokenizer.process() throws on invalid char in DOCTYPE name", () => {
  // Tests line 1957-1963
  assertThrows(
    () => collectTokens("<!DOCTYPE root@name><root/>"),
    XmlSyntaxError,
    "Unexpected character",
  );
});

Deno.test("XmlTokenizer.process() throws on missing quote for PUBLIC ID", () => {
  // Tests line 2061-2063
  assertThrows(
    () => collectTokens("<!DOCTYPE root PUBLIC -//W3C//><root/>"),
    XmlSyntaxError,
    "Expected quote to start public ID",
  );
});

// =============================================================================
// DTD Declaration Keyword Edge Cases
// =============================================================================

Deno.test("XmlTokenizer.process() throws on dash after partial declaration keyword", () => {
  // Tests line 2177-2181: dash after some keyword chars
  assertThrows(
    () => collectTokens("<!DOCTYPE root [<!ENTI-TY x 'y'>]><root/>"),
    XmlSyntaxError,
    "Unexpected '-' in declaration keyword",
  );
});

// =============================================================================
// Illegal Character in Attribute Value Batch Capture
// =============================================================================

Deno.test("XmlTokenizer.process() throws on < in long attribute value", () => {
  // Tests batch capture error path (line 1195-1198)
  const prefix = "a".repeat(100);
  assertThrows(
    () => collectTokens(`<root attr="${prefix}<${prefix}"/>`),
    XmlSyntaxError,
    "'<' not allowed in attribute value",
  );
});

// =============================================================================
// Illegal Chars in CDATA Safe Region
// =============================================================================

Deno.test("XmlTokenizer.process() throws on illegal char in CDATA safe region", () => {
  // Tests line 1140-1147
  const prefix = "a".repeat(100);
  assertThrows(
    () => collectTokens(`<r><![CDATA[${prefix}\x07${prefix}]]></r>`),
    XmlSyntaxError,
    "Illegal XML character",
  );
});
