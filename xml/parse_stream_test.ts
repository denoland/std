// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertRejects } from "@std/assert";
import { XmlParseStream } from "./parse_stream.ts";
import type { XmlEvent } from "./types.ts";
import { XmlSyntaxError } from "./types.ts";

/** Helper to collect all events from a stream (flattens batches). */
async function collectEvents(
  xml: string | string[],
  options?: ConstructorParameters<typeof XmlParseStream>[0],
): Promise<XmlEvent[]> {
  const chunks = typeof xml === "string" ? [xml] : xml;
  const stream = ReadableStream.from(chunks)
    .pipeThrough(new XmlParseStream(options));
  const batches = await Array.fromAsync(stream);
  return batches.flat();
}

// =============================================================================
// Chunked Input (Stream-Specific)
// =============================================================================

Deno.test("XmlParseStream handles multiple chunks", async () => {
  const events = await collectEvents(["<root>", "Hello", "</root>"]);

  assertEquals(events.length, 3);
  assertEquals(events[0]!.type, "start_element");
  assertEquals(events[1]!.type, "text");
  assertEquals(events[2]!.type, "end_element");
});

Deno.test("XmlParseStream handles tag split across chunks", async () => {
  const events = await collectEvents(["<ro", "ot></root>"]);

  assertEquals(events.length, 2);
  if (events[0]!.type === "start_element") {
    assertEquals(events[0]!.name.local, "root");
  }
});

Deno.test("XmlParseStream handles attribute split across chunks", async () => {
  const events = await collectEvents(['<item id="12', '3"/>']);

  assertEquals(events[0]!.type, "start_element");
  if (events[0]!.type === "start_element") {
    assertEquals(events[0]!.attributes[0]!.value, "123");
  }
});

Deno.test("XmlParseStream handles many small chunks", async () => {
  const xml = "<root><item>content</item></root>";
  const chunks = xml.split(""); // One character per chunk
  const events = await collectEvents(chunks);

  assertEquals(events.length, 5);
});

Deno.test("XmlParseStream handles empty chunks", async () => {
  const events = await collectEvents(["", "<root/>", ""]);

  assertEquals(events.length, 2);
});

// =============================================================================
// Error Handling (Stream-Specific)
// =============================================================================

Deno.test("XmlParseStream throws on malformed XML", async () => {
  await assertRejects(
    () => collectEvents("<root attr=value/>"),
    XmlSyntaxError,
  );
});

// =============================================================================
// Complex Documents (Integration)
// =============================================================================

Deno.test("XmlParseStream handles RSS-like feed", async () => {
  const xml = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Example Feed</title>
    <item>
      <title>Item 1</title>
    </item>
  </channel>
</rss>`;

  const events = await collectEvents(xml, { ignoreWhitespace: true });

  const startElements = events.filter((e) => e.type === "start_element");
  const names = startElements.map((e) =>
    e.type === "start_element" ? e.name.local : ""
  );

  assertEquals(names, ["rss", "channel", "title", "item", "title"]);
});

// =============================================================================
// Direct API Usage (Stream-Specific)
// =============================================================================

Deno.test("XmlParseStream writable can be used directly", async () => {
  const stream = new XmlParseStream();
  const writer = stream.writable.getWriter();
  const events: XmlEvent[] = [];

  // Collect event batches in background
  const reader = stream.readable.getReader();
  const readPromise = (async () => {
    while (true) {
      const { done, value: batch } = await reader.read();
      if (done) break;
      events.push(...batch);
    }
  })();

  // Write XML
  await writer.write("<root>");
  await writer.write("<item/>");
  await writer.write("</root>");
  await writer.close();

  await readPromise;

  assertEquals(events.length, 4); // start root, start item, end item, end root
});

Deno.test("XmlParseStream readable can be iterated", async () => {
  const xml = "<root><a/><b/><c/></root>";
  const stream = ReadableStream.from([xml])
    .pipeThrough(new XmlParseStream());

  const events: XmlEvent[] = [];
  for await (const batch of stream) {
    events.push(...batch);
  }

  assertEquals(events.length, 8); // start/end for root, a, b, c
});

// =============================================================================
// File-based Tests (testdata/)
// =============================================================================

Deno.test({
  name: "XmlParseStream parses simple.xml testdata",
  async fn() {
    const url = new URL("./testdata/simple.xml", import.meta.url);
    const { body } = await fetch(url);
    const stream = body!
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new XmlParseStream({ ignoreWhitespace: true }));

    const events = (await Array.fromAsync(stream)).flat();

    // Check declaration
    assertEquals(events[0]!.type, "declaration");
    if (events[0]!.type === "declaration") {
      assertEquals(events[0]!.version, "1.0");
      assertEquals(events[0]!.encoding, "UTF-8");
    }

    // Count elements
    const startElements = events.filter((e) => e.type === "start_element");
    assertEquals(startElements.length, 7); // catalog, 2x(product, name, price)
  },
});

Deno.test({
  name: "XmlParseStream parses rss.xml testdata",
  async fn() {
    const url = new URL("./testdata/rss.xml", import.meta.url);
    const { body } = await fetch(url);
    const stream = body!
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new XmlParseStream({ ignoreWhitespace: true }));

    const events = (await Array.fromAsync(stream)).flat();

    // Find all item titles
    const titles: string[] = [];
    let inItemTitle = false;
    for (const event of events) {
      if (
        event.type === "start_element" && event.name.local === "title" &&
        events.some((e) =>
          e.type === "start_element" && e.name.local === "item"
        )
      ) {
        inItemTitle = true;
      } else if (event.type === "text" && inItemTitle) {
        titles.push(event.text);
        inItemTitle = false;
      }
    }

    // RSS has 3 items
    const itemStarts = events.filter((e) =>
      e.type === "start_element" && e.name.local === "item"
    );
    assertEquals(itemStarts.length, 3);
  },
});

Deno.test({
  name: "XmlParseStream parses namespaced.xml testdata",
  async fn() {
    const url = new URL("./testdata/namespaced.xml", import.meta.url);
    const { body } = await fetch(url);
    const stream = body!
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new XmlParseStream({ ignoreWhitespace: true }));

    const events = (await Array.fromAsync(stream)).flat();

    // Find namespaced elements
    const gElements = events.filter((e) =>
      e.type === "start_element" && e.name.prefix === "g"
    );

    // 2 entries × 4 g: prefixed elements = 8
    assertEquals(gElements.length, 8);
  },
});

Deno.test({
  name: "XmlParseStream parses cdata.xml testdata",
  async fn() {
    const url = new URL("./testdata/cdata.xml", import.meta.url);
    const { body } = await fetch(url);
    const stream = body!
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new XmlParseStream({ ignoreWhitespace: true }));

    const events = (await Array.fromAsync(stream)).flat();

    // Find CDATA sections
    const cdataEvents = events.filter((e) => e.type === "cdata");
    assertEquals(cdataEvents.length, 3); // script, style, data

    // Verify CDATA content preserved special characters
    const dataContent = cdataEvents.find((e) =>
      e.type === "cdata" && e.text.includes("special")
    );
    assertEquals(
      dataContent?.type === "cdata" ? dataContent.text : "",
      'Raw content with <special> & "characters"',
    );
  },
});

Deno.test({
  name: "XmlParseStream parses entities.xml testdata",
  async fn() {
    const url = new URL("./testdata/entities.xml", import.meta.url);
    const { body } = await fetch(url);
    const stream = body!
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new XmlParseStream({ ignoreWhitespace: true }));

    const events = (await Array.fromAsync(stream)).flat();

    // Find the <mixed> element's text content
    let inMixed = false;
    let mixedText = "";
    for (const event of events) {
      if (event.type === "start_element" && event.name.local === "mixed") {
        inMixed = true;
      } else if (event.type === "text" && inMixed) {
        mixedText = event.text;
        inMixed = false;
      }
    }

    // Entities should be decoded
    assertEquals(mixedText, "Tom & Jerry <3");
  },
});

Deno.test({
  name: "XmlParseStream parses large.xml testdata (performance)",
  async fn() {
    const url = new URL("./testdata/large.xml", import.meta.url);
    const { body } = await fetch(url);
    const stream = body!
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new XmlParseStream({ ignoreWhitespace: true }));

    const events = (await Array.fromAsync(stream)).flat();

    // Count product elements (should be 1000)
    const productStarts = events.filter((e) =>
      e.type === "start_element" && e.name.local === "product"
    );
    assertEquals(productStarts.length, 1000);
  },
});

Deno.test({
  name: "XmlParseStream rejects malformed/unclosed.xml testdata",
  async fn() {
    const url = new URL("./testdata/malformed/unclosed.xml", import.meta.url);
    const { body } = await fetch(url);
    const stream = body!
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new XmlParseStream());

    await assertRejects(
      async () => await Array.fromAsync(stream),
      XmlSyntaxError,
    );
  },
});

Deno.test({
  name: "XmlParseStream rejects malformed/mismatched.xml testdata",
  async fn() {
    const url = new URL("./testdata/malformed/mismatched.xml", import.meta.url);
    const { body } = await fetch(url);
    const stream = body!
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new XmlParseStream());

    await assertRejects(
      async () => await Array.fromAsync(stream),
      XmlSyntaxError,
      "Mismatched closing tag",
    );
  },
});
