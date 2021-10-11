// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

const CR = "\r".charCodeAt(0);
const LF = "\n".charCodeAt(0);

/** Transform a stream into a stream where each chunk is divided by a newline,
 * be it `\n` or `\r\n`.
 *
 * ```ts
 * import { LineStream } from "./delimiter.ts";
 * const res = await fetch("https://example.com");
 * const lines = res.body!.pipeThrough(new LineStream());
 * ```
 */
export class LineStream extends TransformStream<Uint8Array, Uint8Array> {
  #bufs: Uint8Array[] = [];
  #prevHadCR = false;

  constructor() {
    super({
      transform: (chunk, controller) => {
        this.#handle(chunk, controller);
      },
      flush: (controller) => {
        controller.enqueue(this.#mergeBufs(false));
      },
    });
  }

  #handle(
    chunk: Uint8Array,
    controller: TransformStreamDefaultController<Uint8Array>,
  ) {
    const lfIndex = chunk.indexOf(LF);

    if (this.#prevHadCR) {
      this.#prevHadCR = false;
      if (lfIndex === 0) {
        controller.enqueue(this.#mergeBufs(true));
        this.#bufs = [];
        this.#handle(chunk.subarray(1), controller);
        return;
      }
    }

    if (lfIndex === -1) {
      if (chunk.at(-1) === CR) {
        this.#prevHadCR = true;
      }
      this.#bufs.push(chunk);
    } else {
      let crOrLfIndex = lfIndex;
      if (chunk[lfIndex - 1] === CR) {
        crOrLfIndex--;
      }
      this.#bufs.push(chunk.subarray(0, crOrLfIndex));
      controller.enqueue(this.#mergeBufs(false));
      this.#bufs = [];
      this.#handle(chunk.subarray(lfIndex + 1), controller);
    }
  }

  #mergeBufs(prevHadCR: boolean): Uint8Array {
    const mergeBuf = new Uint8Array(
      this.#bufs.reduce((acc, buf) => acc + buf.length, 0),
    );
    let offset = 0;
    for (const buf of this.#bufs) {
      mergeBuf.set(buf, offset);
      offset += buf.length;
    }
    if (prevHadCR) {
      return mergeBuf.subarray(0, -1);
    } else {
      return mergeBuf;
    }
  }
}

/** Transform a stream into a stream where each chunk is divided by a given delimiter.
 *
 * ```ts
 * import { TextDelimiterStream } from "./delimiter.ts";
 * const res = await fetch("https://example.com");
 * const lines = res.body!
 *   .pipeThrough(new TextDecoderStream())
 *   .pipeThrough(new TextDelimiterStream("foo"));
 * ```
 */
export class TextDelimiterStream extends TransformStream<string, string> {
  #buf = "";
  #delimiter: string;

  constructor(delimiter: string) {
    super({
      transform: (chunk, controller) => {
        this.#handle(chunk, controller);
      },
      flush: (controller) => {
        controller.enqueue(this.#buf);
      },
    });

    this.#delimiter = delimiter;
  }

  #handle(chunk: string, controller: TransformStreamDefaultController<string>) {
    const lfIndex = chunk.indexOf(this.#delimiter);
    if (lfIndex === -1) {
      this.#buf += chunk;
    } else {
      this.#buf += chunk.slice(0, lfIndex);
      controller.enqueue(this.#buf);
      this.#buf = "";
      this.#handle(chunk.slice(lfIndex + this.#delimiter.length), controller);
    }
  }
}
