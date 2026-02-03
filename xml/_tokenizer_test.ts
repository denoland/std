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
