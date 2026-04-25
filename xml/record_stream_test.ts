// Copyright 2018-2026 the Deno authors. MIT license.

import { assert, assertEquals, assertRejects } from "@std/assert";
import { XmlRecordStream } from "./record_stream.ts";
import { XmlSyntaxError } from "./types.ts";

async function collect<T>(stream: ReadableStream<T>): Promise<T[]> {
  const records: T[] = [];
  await stream.pipeTo(
    new WritableStream({
      write(r) {
        records.push(r);
      },
    }),
  );
  return records;
}

function itemStream(
  xml: string | string[],
): ReadableStream<Record<string, string>> {
  const chunks = Array.isArray(xml) ? xml : [xml];
  return ReadableStream.from(chunks).pipeThrough(
    new XmlRecordStream<Record<string, string>>({
      ignoreWhitespace: true,
      createCallbacks(emit) {
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
    }),
  );
}

// =============================================================================
// Basic record emission
// =============================================================================

Deno.test("XmlRecordStream() emits records assembled from callbacks", async () => {
  const xml =
    "<root><item><title>A</title></item><item><title>B</title></item></root>";
  const records = await collect(itemStream(xml));
  assertEquals(records, [{ title: "A" }, { title: "B" }]);
});

Deno.test("XmlRecordStream() assembles records spanning chunk boundaries", async () => {
  const xml =
    "<root><item><title>Hello</title></item><item><title>World</title></item></root>";
  const chunks: string[] = [];
  for (let i = 0; i < xml.length; i += 7) chunks.push(xml.slice(i, i + 7));
  const records = await collect(itemStream(chunks));
  assertEquals(records, [{ title: "Hello" }, { title: "World" }]);
});

Deno.test("XmlRecordStream() closes cleanly when no records are emitted", async () => {
  const xml = "<root><other>x</other></root>";
  const records = await collect(itemStream(xml));
  assertEquals(records, []);
});

Deno.test("XmlRecordStream() errors on truly empty input (no root element)", async () => {
  await assertRejects(() => collect(itemStream("")), XmlSyntaxError);
});

Deno.test("XmlRecordStream() preserves record order across many chunks", async () => {
  const n = 100;
  const xml = `<root>${
    Array.from({ length: n }, (_, i) => `<item><id>${i}</id></item>`).join("")
  }</root>`;
  const chunks: string[] = [];
  for (let i = 0; i < xml.length; i += 13) chunks.push(xml.slice(i, i + 13));
  const records = await collect(itemStream(chunks));
  assertEquals(records, Array.from({ length: n }, (_, i) => ({ id: `${i}` })));
});

// =============================================================================
// Parse option forwarding
// =============================================================================

Deno.test("XmlRecordStream() ignoreWhitespace suppresses whitespace-only text events", async () => {
  const xml = "<root>\n  <item>A</item>\n</root>";
  const texts: string[] = [];
  await collect(
    ReadableStream.from([xml]).pipeThrough(
      new XmlRecordStream<string>({
        ignoreWhitespace: true,
        createCallbacks(emit) {
          return {
            onText(text) {
              texts.push(text);
              emit(text);
            },
          };
        },
      }),
    ),
  );
  assertEquals(texts, ["A"]);
});

Deno.test("XmlRecordStream() xmlVersion '1.1' enables XML 1.1 character rules", async () => {
  const xml = "<root>&#x1;</root>";
  const records = await collect(
    ReadableStream.from([xml]).pipeThrough(
      new XmlRecordStream<string>({
        xmlVersion: "1.1",
        createCallbacks(emit) {
          return {
            onText(text) {
              emit(text);
            },
          };
        },
      }),
    ),
  );
  assertEquals(records, ["\x01"]);
});

Deno.test("XmlRecordStream() rejects DOCTYPE by default", async () => {
  const xml = '<!DOCTYPE root SYSTEM "x.dtd"><root/>';
  const stream = ReadableStream.from([xml]).pipeThrough(
    new XmlRecordStream<never>({ createCallbacks: (_emit) => ({}) }),
  );
  await assertRejects(() => collect(stream), XmlSyntaxError);
});

Deno.test("XmlRecordStream() allows DOCTYPE when disallowDoctype is false", async () => {
  const xml = "<!DOCTYPE root><root><item><id>1</id></item></root>";
  const records = await collect(
    ReadableStream.from([xml]).pipeThrough(
      new XmlRecordStream<string>({
        disallowDoctype: false,
        createCallbacks(emit) {
          return {
            onText(text) {
              emit(text);
            },
          };
        },
      }),
    ),
  );
  assertEquals(records, ["1"]);
});

// =============================================================================
// createCallbacks lifecycle
// =============================================================================

Deno.test("XmlRecordStream() invokes createCallbacks exactly once per stream instance", async () => {
  let callCount = 0;
  const xml = "<root><item/><item/></root>";
  await collect(
    ReadableStream.from([xml]).pipeThrough(
      new XmlRecordStream<string>({
        createCallbacks(emit) {
          callCount++;
          return {
            onStartElement(name) {
              if (name === "item") emit(name);
            },
          };
        },
      }),
    ),
  );
  assertEquals(callCount, 1);
});

// =============================================================================
// Error semantics
// =============================================================================

Deno.test("XmlRecordStream() errors stream on malformed XML", async () => {
  const xml = "<root attr=value/>";
  const stream = ReadableStream.from([xml]).pipeThrough(
    new XmlRecordStream<never>({ createCallbacks: (_emit) => ({}) }),
  );
  await assertRejects(() => collect(stream), XmlSyntaxError);
});

Deno.test("XmlRecordStream() errors stream when a callback throws", async () => {
  const xml = "<root><item/></root>";
  const stream = ReadableStream.from([xml]).pipeThrough(
    new XmlRecordStream<never>({
      createCallbacks(_emit) {
        return {
          onStartElement(name) {
            if (name === "item") throw new Error("callback error");
          },
        };
      },
    }),
  );
  await assertRejects(() => collect(stream), Error, "callback error");
});

Deno.test("XmlRecordStream() errors stream when createCallbacks throws", async () => {
  const stream = ReadableStream.from(["<root/>"]).pipeThrough(
    new XmlRecordStream<never>({
      createCallbacks(_emit) {
        throw new Error("init error");
      },
    }),
  );
  await assertRejects(() => collect(stream), Error, "init error");
});

// =============================================================================
// Backpressure and cancellation
// =============================================================================

function idStream() {
  return new XmlRecordStream<string>({
    ignoreWhitespace: true,
    createCallbacks(emit) {
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
  });
}

Deno.test("XmlRecordStream() delivers all records correctly with a slow downstream", async () => {
  const n = 20;
  const xml = `<root>${
    Array.from({ length: n }, (_, i) => `<item><id>${i}</id></item>`).join("")
  }</root>`;
  const received: string[] = [];

  await ReadableStream.from([xml])
    .pipeThrough(idStream())
    .pipeTo(
      new WritableStream({
        async write(record) {
          await new Promise<void>((r) => setTimeout(r, 0));
          received.push(record);
        },
      }),
    );

  assertEquals(received, Array.from({ length: n }, (_, i) => `${i}`));
});

Deno.test("XmlRecordStream() pauses upstream pulls while downstream is blocked", async () => {
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

  let release: (() => void) | undefined;
  const blocker = new Promise<void>((r) => {
    release = r;
  });
  let writeCount = 0;
  const writable = new WritableStream<string>({
    async write() {
      writeCount++;
      if (writeCount === 1) await blocker;
    },
  });

  const pipePromise = source.pipeThrough(idStream()).pipeTo(writable);

  while (writeCount < 1) {
    await new Promise<void>((r) => setTimeout(r, 5));
  }
  await new Promise<void>((r) => setTimeout(r, 30));
  const pullsWhileBlocked = pullCount;

  release!();
  await pipePromise;

  assert(
    pullsWhileBlocked < totalChunks,
    `expected backpressure to bound upstream pulls while downstream is blocked, got ${pullsWhileBlocked}/${totalChunks}`,
  );
});

Deno.test("XmlRecordStream() propagates cancel reason and emits no records after cancel", async () => {
  const items = Array.from(
    { length: 200 },
    (_, i) => `<item><id>${i}</id></item>`,
  );
  const chunks = ["<root>", ...items, "</root>"];

  let cancelReason: unknown;
  const source = new ReadableStream<string>({
    pull(controller) {
      const next = chunks.shift();
      if (next === undefined) controller.close();
      else controller.enqueue(next);
    },
    cancel(reason) {
      cancelReason = reason;
    },
  });

  const reader = source.pipeThrough(idStream()).getReader();
  await reader.read();
  await reader.read();
  await reader.cancel("done early");

  const after = await reader.read();
  assert(after.done);
  assertEquals(cancelReason, "done early");
});
