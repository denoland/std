// Copyright 2018-2026 the Deno authors. MIT license.

import { assert, assertEquals, assertRejects } from "@std/assert";
import { parseXmlRecords } from "./parse_records.ts";
import { XmlSyntaxError } from "./types.ts";

async function collect<T>(iter: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const r of iter) out.push(r);
  return out;
}

function items(
  xml: string | string[],
): AsyncGenerator<Record<string, string>> {
  const chunks = Array.isArray(xml) ? xml : [xml];
  return parseXmlRecords<Record<string, string>>(
    ReadableStream.from(chunks),
    (emit) => {
      let insideItem = false;
      let currentTag = "";
      let currentItem: Record<string, string> = {};
      return {
        onStartElement(name) {
          if (name === "item") {
            insideItem = true;
            currentItem = {};
          } else if (insideItem) {
            currentTag = name;
          }
        },
        onText(text) {
          if (insideItem && currentTag) {
            currentItem[currentTag] = (currentItem[currentTag] ?? "") + text;
          }
        },
        onEndElement(name) {
          if (name === "item") {
            emit(currentItem);
            insideItem = false;
            currentItem = {};
          }
          currentTag = "";
        },
      };
    },
    { ignoreWhitespace: true },
  );
}

// =============================================================================
// Basic record emission
// =============================================================================

Deno.test("parseXmlRecords() yields records assembled from callbacks", async () => {
  const xml =
    "<root><item><title>A</title></item><item><title>B</title></item></root>";
  const records = await collect(items(xml));
  assertEquals(records, [{ title: "A" }, { title: "B" }]);
});

Deno.test("parseXmlRecords() assembles records spanning chunk boundaries", async () => {
  const xml =
    "<root><item><title>Hello</title></item><item><title>World</title></item></root>";
  const chunks: string[] = [];
  for (let i = 0; i < xml.length; i += 7) chunks.push(xml.slice(i, i + 7));
  const records = await collect(items(chunks));
  assertEquals(records, [{ title: "Hello" }, { title: "World" }]);
});

Deno.test("parseXmlRecords() completes cleanly when no records are emitted", async () => {
  const xml = "<root><other>x</other></root>";
  const records = await collect(items(xml));
  assertEquals(records, []);
});

Deno.test("parseXmlRecords() errors on truly empty input (no root element)", async () => {
  await assertRejects(() => collect(items("")), XmlSyntaxError);
});

Deno.test("parseXmlRecords() preserves record order across many chunks", async () => {
  const n = 100;
  const xml = `<root>${
    Array.from({ length: n }, (_, i) => `<item><id>${i}</id></item>`).join("")
  }</root>`;
  const chunks: string[] = [];
  for (let i = 0; i < xml.length; i += 13) chunks.push(xml.slice(i, i + 13));
  const records = await collect(items(chunks));
  assertEquals(records, Array.from({ length: n }, (_, i) => ({ id: `${i}` })));
});

// =============================================================================
// Parse option forwarding
// =============================================================================

Deno.test("parseXmlRecords() ignoreWhitespace suppresses whitespace-only text events", async () => {
  const xml = "<root>\n  <item>A</item>\n</root>";
  const texts: string[] = [];
  await collect(
    parseXmlRecords<string>(
      ReadableStream.from([xml]),
      (emit) => ({
        onText(text) {
          texts.push(text);
          emit(text);
        },
      }),
      { ignoreWhitespace: true },
    ),
  );
  assertEquals(texts, ["A"]);
});

Deno.test("parseXmlRecords() xmlVersion '1.1' enables XML 1.1 character rules", async () => {
  const xml = "<root>&#x1;</root>";
  const records = await collect(
    parseXmlRecords<string>(
      ReadableStream.from([xml]),
      (emit) => ({
        onText(text) {
          emit(text);
        },
      }),
      { xmlVersion: "1.1" },
    ),
  );
  assertEquals(records, ["\x01"]);
});

Deno.test("parseXmlRecords() rejects DOCTYPE by default", async () => {
  const xml = '<!DOCTYPE root SYSTEM "x.dtd"><root/>';
  await assertRejects(
    () =>
      collect(
        parseXmlRecords<never>(
          ReadableStream.from([xml]),
          (_emit) => ({}),
        ),
      ),
    XmlSyntaxError,
  );
});

Deno.test("parseXmlRecords() allows DOCTYPE when disallowDoctype is false", async () => {
  const xml = "<!DOCTYPE root><root><item><id>1</id></item></root>";
  const records = await collect(
    parseXmlRecords<string>(
      ReadableStream.from([xml]),
      (emit) => ({
        onText(text) {
          emit(text);
        },
      }),
      { disallowDoctype: false },
    ),
  );
  assertEquals(records, ["1"]);
});

// =============================================================================
// createCallbacks lifecycle
// =============================================================================

Deno.test("parseXmlRecords() invokes createCallbacks exactly once per call", async () => {
  let callCount = 0;
  const xml = "<root><item/><item/></root>";
  await collect(
    parseXmlRecords<string>(
      ReadableStream.from([xml]),
      (emit) => {
        callCount++;
        return {
          onStartElement(name) {
            if (name === "item") emit(name);
          },
        };
      },
    ),
  );
  assertEquals(callCount, 1);
});

// =============================================================================
// Error semantics
// =============================================================================

Deno.test("parseXmlRecords() throws on malformed XML", async () => {
  const xml = "<root attr=value/>";
  await assertRejects(
    () =>
      collect(
        parseXmlRecords<never>(
          ReadableStream.from([xml]),
          (_emit) => ({}),
        ),
      ),
    XmlSyntaxError,
  );
});

Deno.test("parseXmlRecords() propagates errors thrown from a callback", async () => {
  const xml = "<root><item/></root>";
  await assertRejects(
    () =>
      collect(
        parseXmlRecords<never>(
          ReadableStream.from([xml]),
          (_emit) => ({
            onStartElement(name) {
              if (name === "item") throw new Error("callback error");
            },
          }),
        ),
      ),
    Error,
    "callback error",
  );
});

Deno.test("parseXmlRecords() propagates errors thrown from createCallbacks", async () => {
  await assertRejects(
    () =>
      collect(
        parseXmlRecords<never>(
          ReadableStream.from(["<root/>"]),
          (_emit) => {
            throw new Error("init error");
          },
        ),
      ),
    Error,
    "init error",
  );
});

// =============================================================================
// Per-record yielding and early termination
// =============================================================================

function ids(xml: string): AsyncGenerator<string> {
  return parseXmlRecords<string>(
    ReadableStream.from([xml]),
    (emit) => {
      let inside = false;
      let text = "";
      return {
        onStartElement(name) {
          if (name === "id") {
            inside = true;
            text = "";
          }
        },
        onText(t) {
          if (inside) text += t;
        },
        onEndElement(name) {
          if (name === "id") {
            emit(text);
            inside = false;
          }
        },
      };
    },
    { ignoreWhitespace: true },
  );
}

Deno.test("parseXmlRecords() yields records as the document is parsed (per-record backpressure)", async () => {
  const n = 20;
  const xml = `<root>${
    Array.from({ length: n }, (_, i) => `<item><id>${i}</id></item>`).join("")
  }</root>`;
  const received: string[] = [];

  for await (const id of ids(xml)) {
    await new Promise<void>((r) => setTimeout(r, 0));
    received.push(id);
  }

  assertEquals(received, Array.from({ length: n }, (_, i) => `${i}`));
});

Deno.test("parseXmlRecords() stops parsing further chunks when the consumer breaks", async () => {
  const items = Array.from(
    { length: 10 },
    (_, i) => `<item><id>${i}</id></item>`,
  );
  const chunks = ["<root>", ...items, "</root>"];
  const totalChunks = chunks.length;
  let pullCount = 0;
  const source = new ReadableStream<string>({
    pull(controller) {
      pullCount++;
      const next = chunks.shift();
      if (next === undefined) controller.close();
      else controller.enqueue(next);
    },
  });

  const iter = parseXmlRecords<string>(
    source,
    (emit) => {
      let inside = false;
      let text = "";
      return {
        onStartElement(name) {
          if (name === "id") {
            inside = true;
            text = "";
          }
        },
        onText(t) {
          if (inside) text += t;
        },
        onEndElement(name) {
          if (name === "id") {
            emit(text);
            inside = false;
          }
        },
      };
    },
    { ignoreWhitespace: true },
  );

  const received: string[] = [];
  for await (const id of iter) {
    received.push(id);
    if (received.length === 2) break;
  }

  assertEquals(received, ["0", "1"]);
  assert(
    pullCount < totalChunks,
    `expected early break to bound upstream pulls, got ${pullCount}/${totalChunks}`,
  );
});
