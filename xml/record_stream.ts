// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * A transform stream that adapts XML event callbacks into a stream of
 * application-defined records.
 *
 * @module
 */

import type { ParseStreamOptions, XmlEventCallbacks } from "./types.ts";
import { XmlTokenizer } from "./_tokenizer.ts";
import { XmlEventParser } from "./_parser.ts";

/**
 * Options for {@linkcode XmlRecordStream}.
 *
 * @typeParam T The type of records emitted by the stream.
 */
export interface XmlRecordStreamOptions<T> extends ParseStreamOptions {
  /**
   * Factory that receives an `emit` function and returns XML event callbacks.
   * Called once per stream instance. Call `emit(record)` inside callbacks to
   * push a complete record downstream.
   *
   * Declared as a property (not method shorthand) so callback assignability
   * is checked strictly by TypeScript.
   */
  createCallbacks: (emit: (record: T) => void) => XmlEventCallbacks;
}

/**
 * A transform stream that parses XML string chunks and emits
 * application-defined records assembled inside {@linkcode XmlEventCallbacks}.
 *
 * The user builds records in normal XML event callbacks and calls `emit(record)`
 * whenever a complete record has been assembled. Backpressure is chunk-level:
 * all records emitted within a single input chunk are enqueued before the next
 * chunk is pulled.
 *
 * @example Parse items from an XML feed
 * ```ts
 * import { XmlRecordStream } from "@std/xml/record-stream";
 * import { assertEquals } from "@std/assert";
 *
 * const xml = `<feed>
 *   <item><title>First</title></item>
 *   <item><title>Second</title></item>
 * </feed>`;
 *
 * type Item = { title: string };
 * const records: Item[] = [];
 *
 * await ReadableStream.from([xml])
 *   .pipeThrough(new XmlRecordStream<Item>({
 *     ignoreWhitespace: true,
 *     createCallbacks(emit) {
 *       let insideItem = false;
 *       let insideTitle = false;
 *       let title = "";
 *       return {
 *         onStartElement(name) {
 *           if (name === "item") { insideItem = true; title = ""; }
 *           else if (insideItem && name === "title") insideTitle = true;
 *         },
 *         onText(text) {
 *           if (insideTitle) title += text;
 *         },
 *         onEndElement(name) {
 *           if (name === "title") insideTitle = false;
 *           if (name === "item") { emit({ title }); insideItem = false; }
 *         },
 *       };
 *     },
 *   }))
 *   .pipeTo(new WritableStream({ write(r) { records.push(r); } }));
 *
 * assertEquals(records, [{ title: "First" }, { title: "Second" }]);
 * ```
 *
 * @typeParam T The type of records emitted by the stream.
 */
export class XmlRecordStream<T> extends TransformStream<string, T> {
  /**
   * Constructs a new {@linkcode XmlRecordStream}.
   *
   * @param options Options for configuring the parser and the record factory.
   */
  constructor(options: XmlRecordStreamOptions<T>) {
    const { createCallbacks, ...parseOptions } = options;
    const trackPosition = parseOptions.trackPosition ?? false;
    const disallowDoctype = parseOptions.disallowDoctype ?? true;
    const xml11 = parseOptions.xmlVersion === "1.1";

    let tokenizer: XmlTokenizer | undefined;
    let parser: XmlEventParser | undefined;

    super({
      start(controller) {
        try {
          const callbacks = createCallbacks((record) =>
            controller.enqueue(record)
          );
          tokenizer = new XmlTokenizer({
            trackPosition,
            disallowDoctype,
            xml11,
          });
          parser = new XmlEventParser(callbacks, parseOptions, xml11);
        } catch (error) {
          controller.error(error);
        }
      },
      transform(chunk) {
        tokenizer!.process(chunk, parser!);
      },
      flush() {
        tokenizer!.finalize(parser!);
        parser!.finalize();
      },
    });
  }
}
