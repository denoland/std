// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import { BytesList } from "../bytes/bytes_list.ts";

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
  #bufs = new BytesList();
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
        this.#handle(chunk.subarray(1), controller);
        return;
      }
    }

    if (lfIndex === -1) {
      if (chunk.at(-1) === CR) {
        this.#prevHadCR = true;
      }
      this.#bufs.add(chunk);
    } else {
      let crOrLfIndex = lfIndex;
      if (chunk[lfIndex - 1] === CR) {
        crOrLfIndex--;
      }
      this.#bufs.add(chunk.subarray(0, crOrLfIndex));
      controller.enqueue(this.#mergeBufs(false));
      this.#handle(chunk.subarray(lfIndex + 1), controller);
    }
  }

  #mergeBufs(prevHadCR: boolean): Uint8Array {
    const mergeBuf = this.#bufs.concat();
    this.#bufs = new BytesList();

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
 * import { DelimiterStream } from "./delimiter.ts";
 * const res = await fetch("https://example.com");
 * const parts = res.body!
 *   .pipeThrough(new DelimiterStream(new TextEncoder().encode("foo")))
 *   .pipeThrough(new TextDecoderStream());
 * ```
 */
export class DelimiterStream extends TransformStream<Uint8Array, Uint8Array> {
  #bufs = new BytesList();
  #delimiter: Uint8Array;
  #inspectIndex = 0;
  #matchIndex = 0;
  #delimLen: number;
  #delimLPS: Uint8Array;

  constructor(delimiter: Uint8Array) {
    super({
      transform: (chunk, controller) => {
        this.#handle(chunk, controller);
      },
      flush: (controller) => {
        controller.enqueue(this.#bufs.concat());
      },
    });

    this.#delimiter = delimiter;
    this.#delimLen = delimiter.length;
    this.#delimLPS = createLPS(delimiter);
  }

  #handle(
    chunk: Uint8Array,
    controller: TransformStreamDefaultController<Uint8Array>,
  ) {
    this.#bufs.add(chunk);
    let localIndex = 0;
    while (this.#inspectIndex < this.#bufs.size()) {
      if (chunk[localIndex] === this.#delimiter[this.#matchIndex]) {
        this.#inspectIndex++;
        localIndex++;
        this.#matchIndex++;
        if (this.#matchIndex === this.#delimLen) {
          // Full match
          const matchEnd = this.#inspectIndex - this.#delimLen;
          const readyBytes = this.#bufs.slice(0, matchEnd);
          controller.enqueue(readyBytes);
          // Reset match, different from KMP.
          this.#bufs.shift(this.#inspectIndex);
          this.#inspectIndex = 0;
          this.#matchIndex = 0;
        }
      } else {
        if (this.#matchIndex === 0) {
          this.#inspectIndex++;
          localIndex++;
        } else {
          this.#matchIndex = this.#delimLPS[this.#matchIndex - 1];
        }
      }
    }
  }
}

/** Generate longest proper prefix which is also suffix array. */
function createLPS(pat: Uint8Array): Uint8Array {
  const lps = new Uint8Array(pat.length);
  lps[0] = 0;
  let prefixEnd = 0;
  let i = 1;
  while (i < lps.length) {
    if (pat[i] == pat[prefixEnd]) {
      prefixEnd++;
      lps[i] = prefixEnd;
      i++;
    } else if (prefixEnd === 0) {
      lps[i] = 0;
      i++;
    } else {
      prefixEnd = lps[prefixEnd - 1];
    }
  }
  return lps;
}
