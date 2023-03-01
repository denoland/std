// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import {
  convertRowToObject,
  defaultReadOptions,
  type LineReader,
  parseRecord,
  type RowType,
} from "./_io.ts";
import { TextDelimiterStream } from "../../streams/text_delimiter_stream.ts";

export interface CsvStreamOptions {
  separator?: string;
  comment?: string;
  skipFirstRow?: boolean;
  columns?: string[];
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

export class CsvStream<T extends CsvStreamOptions>
  implements TransformStream<string, RowType<CsvStreamOptions, T>> {
  readonly #readable: ReadableStream<
    string[] | Record<string, string | unknown>
  >;
  readonly #options: CsvStreamOptions;
  readonly #lineReader: StreamLineReader;
  readonly #lines: TextDelimiterStream;
  #lineIndex = 0;
  #isFirstRow = true;

  #headers: string[] = [];

  constructor(options: T = defaultReadOptions as T) {
    this.#options = {
      ...defaultReadOptions,
      ...options,
    };

    this.#lines = new TextDelimiterStream("\n");
    this.#lineReader = new StreamLineReader(this.#lines.readable.getReader());
    this.#readable = new ReadableStream({
      pull: (controller) => this.#pull(controller),
      cancel: () => this.#lineReader.cancel(),
    });
  }

  async #pull(
    controller: ReadableStreamDefaultController<
      string[] | Record<string, string | unknown>
    >,
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

    if (this.#isFirstRow) {
      this.#isFirstRow = false;
      if (this.#options.skipFirstRow || this.#options.columns) {
        this.#headers = [];

        if (this.#options.skipFirstRow) {
          const head = record;
          this.#headers = head;
        }

        if (this.#options.columns) {
          this.#headers = this.#options.columns;
        }
      }

      if (this.#options.skipFirstRow) {
        return this.#pull(controller);
      }
    }

    this.#lineIndex++;
    if (record.length > 0) {
      if (this.#options.skipFirstRow || this.#options.columns) {
        controller.enqueue(convertRowToObject(
          record,
          this.#headers,
          this.#lineIndex,
        ));
      } else {
        controller.enqueue(record);
      }
    } else {
      return this.#pull(controller);
    }
  }

  get readable() {
    return this.#readable as ReadableStream<RowType<CsvStreamOptions, T>>;
  }

  get writable(): WritableStream<string> {
    return this.#lines.writable;
  }
}
