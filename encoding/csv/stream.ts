// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { defaultReadOptions, parseRecord } from "./_io.ts";
import type { LineReader } from "./_io.ts";
import { TextDelimiterStream } from "../../streams/delimiter.ts";

export interface CSVStreamOptions {
  separator?: string;
  comment?: string;
}

class StreamLineReader implements LineReader {
  #reader: ReadableStreamDefaultReader<string>;
  #done = false;
  constructor(reader: ReadableStreamDefaultReader<string>) {
    this.#reader = reader;
  }

  async readLine(): Promise<string | null> {
    const { value, done } = await this.#reader.read();
    if (done) {
      this.#done = true;
      return null;
    } else {
      // NOTE: Remove trailing CR for compatibility with golang's `encoding/csv`
      return stripLastCR(value!);
    }
  }

  isEOF(): Promise<boolean> {
    return Promise.resolve(this.#done);
  }

  cancel() {
    this.#reader.cancel();
  }
}

function stripLastCR(s: string): string {
  return s.endsWith("\r") ? s.slice(0, -1) : s;
}

export class CSVStream implements TransformStream<string, Array<string>> {
  readonly #readable: ReadableStream<Array<string>>;
  readonly #options: CSVStreamOptions;
  readonly #lineReader: StreamLineReader;
  readonly #lines: TextDelimiterStream;
  #lineIndex = 0;

  constructor(options: CSVStreamOptions = defaultReadOptions) {
    this.#options = {
      ...defaultReadOptions,
      ...options,
    };

    this.#lines = new TextDelimiterStream("\n");
    this.#lineReader = new StreamLineReader(this.#lines.readable.getReader());
    this.#readable = new ReadableStream<Array<string>>({
      pull: (controller) => this.#pull(controller),
      cancel: () => this.#lineReader.cancel(),
    });
  }

  async #pull(
    controller: ReadableStreamDefaultController<Array<string>>,
  ): Promise<void> {
    const line = await this.#lineReader.readLine();
    if (line === "") {
      // Found an empty line
      this.#lineIndex++;
      return this.#pull(controller);
    }
    if (line === null) {
      // Reached to EOF
      controller.close();
      this.#lineReader.cancel();
      return;
    }

    const record = await parseRecord(
      line,
      this.#lineReader,
      this.#options,
      this.#lineIndex,
    );
    if (record === null) {
      controller.close();
      this.#lineReader.cancel();
      return;
    }

    this.#lineIndex++;
    if (record.length > 0) {
      controller.enqueue(record);
    } else {
      return this.#pull(controller);
    }
  }

  get readable(): ReadableStream<Array<string>> {
    return this.#readable;
  }

  get writable(): WritableStream<string> {
    return this.#lines.writable;
  }
}
