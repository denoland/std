// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertRejects } from "@std/assert";
import { parseXmlStream, parseXmlStreamFromBytes } from "./parse_stream.ts";
import { XmlSyntaxError } from "./types.ts";

// =============================================================================
// parseXmlStream (Direct Callback API)
// =============================================================================

Deno.test("parseXmlStream() basic usage", async () => {
  const xml = "<root><item>Hello</item></root>";
  const stream = ReadableStream.from([xml]);

  const elements: string[] = [];
  const texts: string[] = [];

  await parseXmlStream(stream, {
    onStartElement(name) {
      elements.push(name);
    },
    onText(text) {
      texts.push(text);
    },
  });

  assertEquals(elements, ["root", "item"]);
  assertEquals(texts, ["Hello"]);
});

Deno.test("parseXmlStream() handles chunked input", async () => {
  const stream = ReadableStream.from(["<root>", "Hello", "</root>"]);

  const elements: string[] = [];
  const texts: string[] = [];

  await parseXmlStream(stream, {
    onStartElement(name) {
      elements.push(name);
    },
    onEndElement(name) {
      elements.push(`/${name}`);
    },
    onText(text) {
      texts.push(text);
    },
  });

  assertEquals(elements, ["root", "/root"]);
  assertEquals(texts, ["Hello"]);
});

Deno.test("parseXmlStream() handles attributes via iterator", async () => {
  const xml = '<root id="1" class="test"><item name="foo"/></root>';
  const stream = ReadableStream.from([xml]);

  const attrs: Array<{ name: string; value: string }> = [];

  await parseXmlStream(stream, {
    onStartElement(_name, _colonIndex, _uri, attributes) {
      for (let i = 0; i < attributes.count; i++) {
        attrs.push({
          name: attributes.getName(i),
          value: attributes.getValue(i),
        });
      }
    },
  });

  assertEquals(attrs, [
    { name: "id", value: "1" },
    { name: "class", value: "test" },
    { name: "name", value: "foo" },
  ]);
});

Deno.test("parseXmlStream() handles namespaced elements", async () => {
  const xml = '<ns:root xmlns:ns="http://example.com"><ns:item/></ns:root>';
  const stream = ReadableStream.from([xml]);

  const elements: Array<{ name: string; prefix?: string }> = [];

  await parseXmlStream(stream, {
    onStartElement(name, colonIndex) {
      if (colonIndex === -1) {
        elements.push({ name });
      } else {
        elements.push({
          name: name.slice(colonIndex + 1),
          prefix: name.slice(0, colonIndex),
        });
      }
    },
  });

  assertEquals(elements, [
    { name: "root", prefix: "ns" },
    { name: "item", prefix: "ns" },
  ]);
});

Deno.test("parseXmlStream() handles position tracking", async () => {
  const xml = "<root><item/></root>";
  const stream = ReadableStream.from([xml]);

  const positions: Array<{ name: string; line: number; column: number }> = [];

  await parseXmlStream(
    stream,
    {
      onStartElement(
        name,
        _colonIndex,
        _uri,
        _attrs,
        _selfClosing,
        line,
        column,
      ) {
        positions.push({ name, line, column });
      },
    },
    { trackPosition: true },
  );

  assertEquals(positions, [
    { name: "root", line: 1, column: 1 },
    { name: "item", line: 1, column: 7 },
  ]);
});

Deno.test("parseXmlStream() handles CDATA and comments", async () => {
  const xml = "<root><![CDATA[data]]><!-- comment --></root>";
  const stream = ReadableStream.from([xml]);

  const events: Array<{ type: string; text: string }> = [];

  await parseXmlStream(stream, {
    onCData(text) {
      events.push({ type: "cdata", text });
    },
    onComment(text) {
      events.push({ type: "comment", text });
    },
  });

  assertEquals(events, [
    { type: "cdata", text: "data" },
    { type: "comment", text: " comment " },
  ]);
});

Deno.test("parseXmlStream() handles declaration", async () => {
  const xml = '<?xml version="1.0" encoding="UTF-8"?><root/>';
  const stream = ReadableStream.from([xml]);

  let version = "";
  let encoding = "";

  await parseXmlStream(stream, {
    onDeclaration(v, e) {
      version = v;
      if (e) encoding = e;
    },
  });

  assertEquals(version, "1.0");
  assertEquals(encoding, "UTF-8");
});

Deno.test("parseXmlStream() ignores whitespace when configured", async () => {
  const xml = "<root>\n  <item/>\n</root>";
  const stream = ReadableStream.from([xml]);

  const texts: string[] = [];

  await parseXmlStream(
    stream,
    {
      onText(text) {
        texts.push(text);
      },
    },
    { ignoreWhitespace: true },
  );

  assertEquals(texts, []);
});

Deno.test("parseXmlStream() throws on malformed XML", async () => {
  const xml = "<root attr=value/>";
  const stream = ReadableStream.from([xml]);

  await assertRejects(
    () => parseXmlStream(stream, {}),
    XmlSyntaxError,
  );
});

Deno.test("parseXmlStream() accepts AsyncIterable", async () => {
  async function* generateChunks(): AsyncGenerator<string> {
    yield "<root>";
    yield "<item/>";
    yield "</root>";
  }

  const elements: string[] = [];

  await parseXmlStream(generateChunks(), {
    onStartElement(name) {
      elements.push(name);
    },
  });

  assertEquals(elements, ["root", "item"]);
});

Deno.test("parseXmlStream() handles tag split across chunks", async () => {
  const stream = ReadableStream.from(["<ro", "ot></root>"]);

  const elements: string[] = [];

  await parseXmlStream(stream, {
    onStartElement(name) {
      elements.push(name);
    },
  });

  assertEquals(elements, ["root"]);
});

Deno.test("parseXmlStream() handles attribute split across chunks", async () => {
  const stream = ReadableStream.from(['<item id="12', '3"/>']);

  const attrs: string[] = [];

  await parseXmlStream(stream, {
    onStartElement(_name, _colonIndex, _uri, attributes) {
      for (let i = 0; i < attributes.count; i++) {
        attrs.push(attributes.getValue(i));
      }
    },
  });

  assertEquals(attrs, ["123"]);
});

Deno.test("parseXmlStream() handles many small chunks", async () => {
  const xml = "<root><item>content</item></root>";
  const chunks = xml.split(""); // One character per chunk
  const stream = ReadableStream.from(chunks);

  const elements: string[] = [];

  await parseXmlStream(stream, {
    onStartElement(name) {
      elements.push(name);
    },
    onEndElement(name) {
      elements.push(`/${name}`);
    },
  });

  assertEquals(elements, ["root", "item", "/item", "/root"]);
});

Deno.test("parseXmlStream() handles empty chunks", async () => {
  const stream = ReadableStream.from(["", "<root/>", ""]);

  const elements: string[] = [];

  await parseXmlStream(stream, {
    onStartElement(name) {
      elements.push(name);
    },
    onEndElement(name) {
      elements.push(`/${name}`);
    },
  });

  assertEquals(elements, ["root", "/root"]);
});

Deno.test("parseXmlStream() handles RSS-like feed", async () => {
  const xml = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Example Feed</title>
    <item>
      <title>Item 1</title>
    </item>
  </channel>
</rss>`;

  const stream = ReadableStream.from([xml]);
  const elements: string[] = [];

  await parseXmlStream(
    stream,
    {
      onStartElement(name) {
        elements.push(name);
      },
    },
    { ignoreWhitespace: true },
  );

  assertEquals(elements, ["rss", "channel", "title", "item", "title"]);
});

// =============================================================================
// parseXmlStreamFromBytes
// =============================================================================

Deno.test("parseXmlStreamFromBytes() handles byte stream", async () => {
  const xml = "<root><item>Hello</item></root>";
  const bytes = new TextEncoder().encode(xml);
  const stream = ReadableStream.from([bytes]);

  const elements: string[] = [];

  await parseXmlStreamFromBytes(stream, {
    onStartElement(name) {
      elements.push(name);
    },
  });

  assertEquals(elements, ["root", "item"]);
});

Deno.test("parseXmlStreamFromBytes() handles multi-byte characters", async () => {
  const xml = "<root>Hello 世界 🌍</root>";
  const bytes = new TextEncoder().encode(xml);
  // Split bytes to test streaming decode
  const chunk1 = bytes.slice(0, 15);
  const chunk2 = bytes.slice(15);
  const stream = ReadableStream.from([chunk1, chunk2]);

  const texts: string[] = [];

  await parseXmlStreamFromBytes(stream, {
    onText(text) {
      texts.push(text);
    },
  });

  assertEquals(texts.join(""), "Hello 世界 🌍");
});

Deno.test("parseXmlStreamFromBytes() accepts AsyncIterable", async () => {
  const xml = "<root><item/></root>";
  const bytes = new TextEncoder().encode(xml);

  async function* generateChunks(): AsyncGenerator<Uint8Array> {
    yield bytes.slice(0, 6);
    yield bytes.slice(6);
  }

  const elements: string[] = [];

  await parseXmlStreamFromBytes(generateChunks(), {
    onStartElement(name) {
      elements.push(name);
    },
  });

  assertEquals(elements, ["root", "item"]);
});

// =============================================================================
// AsyncIterable tests (using Symbol.asyncIterator check path)
// =============================================================================

Deno.test("parseXmlStream() handles AsyncIterable via Symbol.asyncIterator check", async () => {
  // This tests the Symbol.asyncIterator branch in parseXmlStream
  async function* generateChunks(): AsyncGenerator<string> {
    yield "<root>";
    yield "<item>text</item>";
    yield "</root>";
  }

  const elements: string[] = [];
  const texts: string[] = [];

  // Cast to AsyncIterable to ensure we hit the asyncIterator check path
  const iterable: AsyncIterable<string> = generateChunks();

  await parseXmlStream(iterable, {
    onStartElement(name) {
      elements.push(name);
    },
    onText(text) {
      texts.push(text);
    },
  });

  assertEquals(elements, ["root", "item"]);
  assertEquals(texts, ["text"]);
});

Deno.test("parseXmlStreamFromBytes() handles AsyncIterable with multi-byte split", async () => {
  // Test that decodeAsyncIterable handles the final yield properly
  // and that multi-byte characters split across chunks are decoded correctly
  const xml = "<root>Hello 世界</root>";
  const bytes = new TextEncoder().encode(xml);

  // Split in the middle of a multi-byte character to test incomplete chunk handling
  async function* generateChunks(): AsyncGenerator<Uint8Array> {
    yield bytes.slice(0, 10);
    yield bytes.slice(10, 15); // May split multi-byte char
    yield bytes.slice(15);
  }

  const texts: string[] = [];

  // Cast to AsyncIterable to ensure we hit the asyncIterator check path
  const iterable: AsyncIterable<Uint8Array> = generateChunks();

  await parseXmlStreamFromBytes(iterable, {
    onText(text) {
      texts.push(text);
    },
  });

  assertEquals(texts.join(""), "Hello 世界");
});

Deno.test("parseXmlStreamFromBytes() flushes decoder at end of stream", async () => {
  // Tests the final decoder.decode() flush path (line 160)
  // Use multiple small chunks to ensure decoder has buffered state
  const xml = "<root>test</root>";
  const bytes = new TextEncoder().encode(xml);

  // Split into very small chunks
  const chunks: Uint8Array[] = [];
  for (let i = 0; i < bytes.length; i += 3) {
    chunks.push(bytes.slice(i, Math.min(i + 3, bytes.length)));
  }

  let text = "";
  await parseXmlStreamFromBytes(ReadableStream.from(chunks), {
    onText: (t) => {
      text += t;
    },
  });

  assertEquals(text, "test");
});

// =============================================================================
// Streaming Parser Error Tests (XmlEventParser validation paths)
// =============================================================================

Deno.test("parseXmlStream() throws on invalid QName element name", async () => {
  const xml = '<:element xmlns=":"/>';
  const stream = ReadableStream.from([xml]);

  await assertRejects(
    () => parseXmlStream(stream, {}),
    XmlSyntaxError,
    "QName cannot start with ':'",
  );
});

Deno.test("parseXmlStream() throws on element using xmlns prefix", async () => {
  const xml = '<xmlns:test xmlns:xmlns="http://example.com"/>';
  const stream = ReadableStream.from([xml]);

  await assertRejects(
    () => parseXmlStream(stream, {}),
    XmlSyntaxError,
    "Element name cannot use the 'xmlns' prefix",
  );
});

Deno.test("parseXmlStream() throws on invalid QName attribute name", async () => {
  const xml = '<root :attr="value"/>';
  const stream = ReadableStream.from([xml]);

  await assertRejects(
    () => parseXmlStream(stream, {}),
    XmlSyntaxError,
    "QName cannot start with ':'",
  );
});

Deno.test("parseXmlStream() throws on invalid namespace binding", async () => {
  // xmlns:xml cannot be rebound to a different URI
  const xml = '<root xmlns:xml="http://wrong.com"/>';
  const stream = ReadableStream.from([xml]);

  await assertRejects(
    () => parseXmlStream(stream, {}),
    XmlSyntaxError,
  );
});

Deno.test("parseXmlStream() throws on duplicate attribute", async () => {
  const xml = '<root attr="1" attr="2"/>';
  const stream = ReadableStream.from([xml]);

  await assertRejects(
    () => parseXmlStream(stream, {}),
    XmlSyntaxError,
    "Duplicate attribute",
  );
});

Deno.test("parseXmlStream() throws on multiple root elements", async () => {
  const xml = "<root/><extra/>";
  const stream = ReadableStream.from([xml]);

  await assertRejects(
    () => parseXmlStream(stream, {}),
    XmlSyntaxError,
    "Only one root element is allowed",
  );
});

Deno.test("parseXmlStream() throws on unbound namespace prefix in element", async () => {
  const xml = "<ns:root/>";
  const stream = ReadableStream.from([xml]);

  await assertRejects(
    () => parseXmlStream(stream, {}),
    XmlSyntaxError,
    "Unbound namespace prefix",
  );
});

Deno.test("parseXmlStream() throws on unbound namespace prefix in attribute", async () => {
  const xml = '<root ns:attr="value"/>';
  const stream = ReadableStream.from([xml]);

  await assertRejects(
    () => parseXmlStream(stream, {}),
    XmlSyntaxError,
    "Unbound namespace prefix",
  );
});

Deno.test("parseXmlStream() throws on duplicate expanded attribute names", async () => {
  const xml =
    '<root xmlns:a="http://example.com" xmlns:b="http://example.com" a:attr="1" b:attr="2"/>';
  const stream = ReadableStream.from([xml]);

  await assertRejects(
    () => parseXmlStream(stream, {}),
    XmlSyntaxError,
    "Duplicate expanded attribute name",
  );
});

Deno.test("parseXmlStream() throws on text before root", async () => {
  const xml = "text<root/>";
  const stream = ReadableStream.from([xml]);

  await assertRejects(
    () => parseXmlStream(stream, {}),
    XmlSyntaxError,
    "Content is not allowed before the root element",
  );
});

Deno.test("parseXmlStream() throws on text after root", async () => {
  const xml = "<root/>text";
  const stream = ReadableStream.from([xml]);

  await assertRejects(
    () => parseXmlStream(stream, {}),
    XmlSyntaxError,
    "Content is not allowed after the root element",
  );
});

Deno.test("parseXmlStream() throws on entity reference before root", async () => {
  const xml = "&amp;<root/>";
  const stream = ReadableStream.from([xml]);

  await assertRejects(
    () => parseXmlStream(stream, {}),
    XmlSyntaxError,
    "Character/entity references are not allowed in prolog",
  );
});

Deno.test("parseXmlStream() throws on CDATA before root", async () => {
  const xml = "<![CDATA[test]]><root/>";
  const stream = ReadableStream.from([xml]);

  await assertRejects(
    () => parseXmlStream(stream, {}),
    XmlSyntaxError,
    "CDATA section is not allowed before the root element",
  );
});

Deno.test("parseXmlStream() throws on CDATA after root", async () => {
  const xml = "<root/><![CDATA[test]]>";
  const stream = ReadableStream.from([xml]);

  await assertRejects(
    () => parseXmlStream(stream, {}),
    XmlSyntaxError,
    "CDATA section is not allowed after the root element",
  );
});

Deno.test("parseXmlStream() handles xml prefix on element", async () => {
  // xml: prefix is always bound to the XML namespace
  // This tests the xml prefix element URI resolution path
  const xml = '<xml:element xmlns:xml="http://www.w3.org/XML/1998/namespace"/>';
  const stream = ReadableStream.from([xml]);

  const elements: Array<{ name: string; uri: string | undefined }> = [];
  await parseXmlStream(stream, {
    onStartElement(name, _colonIndex, uri) {
      elements.push({ name, uri });
    },
  });

  assertEquals(elements[0]?.name, "xml:element");
  assertEquals(elements[0]?.uri, "http://www.w3.org/XML/1998/namespace");
});

Deno.test("parseXmlStream() handles namespace scope restoration", async () => {
  // Tests that namespace bindings are properly restored when elements close
  const xml =
    `<root xmlns:ns="http://outer.com"><child xmlns:ns="http://inner.com"><ns:inner/></child><ns:outer/></root>`;
  const stream = ReadableStream.from([xml]);

  const elements: Array<{ name: string; uri: string | undefined }> = [];
  await parseXmlStream(stream, {
    onStartElement(name, _colonIndex, uri) {
      elements.push({ name, uri });
    },
  });

  // inner should have inner URI, outer should have outer URI
  const inner = elements.find((e) => e.name === "ns:inner");
  const outer = elements.find((e) => e.name === "ns:outer");

  assertEquals(inner?.uri, "http://inner.com");
  assertEquals(outer?.uri, "http://outer.com");
});

Deno.test("parseXmlStream() handles self-closing element namespace restoration", async () => {
  // Tests namespace restoration for self-closing elements
  const xml =
    '<root xmlns:ns="http://outer.com"><inner xmlns:ns="http://inner.com" ns:attr="value"/><ns:outer/></root>';
  const stream = ReadableStream.from([xml]);

  const elements: Array<{ name: string; uri: string | undefined }> = [];
  await parseXmlStream(stream, {
    onStartElement(name, _colonIndex, uri) {
      elements.push({ name, uri });
    },
  });

  const outer = elements.find((e) => e.name === "ns:outer");
  assertEquals(outer?.uri, "http://outer.com");
});
