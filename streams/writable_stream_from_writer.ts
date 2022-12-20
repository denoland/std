// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { writeAll } from "./write_all.ts";

function isCloser(value: unknown): value is Deno.Closer {
  return typeof value === "object" && value != null && "close" in value &&
    // deno-lint-ignore no-explicit-any
    typeof (value as Record<string, any>)["close"] === "function";
}

export interface WritableStreamFromWriterOptions {
  /**
   * If the `writer` is also a `Deno.Closer`, automatically close the `writer`
   * when the stream is closed, aborted, or a write error occurs.
   *
   * @default {true}
   */
  autoClose?: boolean;
}

/** Create a `WritableStream` from a `Writer`. */
export function writableStreamFromWriter(
  writer: Deno.Writer,
  options: WritableStreamFromWriterOptions = {},
): WritableStream<Uint8Array> {
  const { autoClose = true } = options;

  return new WritableStream({
    async write(chunk, controller) {
      try {
        await writeAll(writer, chunk);
      } catch (e) {
        controller.error(e);
        if (isCloser(writer) && autoClose) {
          writer.close();
        }
      }
    },
    close() {
      if (isCloser(writer) && autoClose) {
        writer.close();
      }
    },
    abort() {
      if (isCloser(writer) && autoClose) {
        writer.close();
      }
    },
  });
}
