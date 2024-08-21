// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "@std/assert";
import { encodeHex } from "./hex.ts";
import { HexDecoderStream, HexEncoderStream } from "./hex_stream.ts";
import { toText } from "@std/streams/to-text";
import { concat } from "@std/bytes/concat";

type Sliceable = {
  slice(start?: number, end?: number): Sliceable;
  length: number;
};

class RandomSliceStream<T extends Sliceable> extends TransformStream<T, T> {
  constructor() {
    super({
      transform(chunk, controller) {
        const i = Math.floor(Math.random() * chunk.length);
        controller.enqueue(chunk.slice(0, i) as T);
        controller.enqueue(chunk.slice(i) as T);
      },
    });
  }
}

Deno.test("HexEncoderStream() encodes stream", async () => {
  const stream = (await Deno.open("./deno.lock"))
    .readable
    .pipeThrough(new RandomSliceStream())
    .pipeThrough(new HexEncoderStream());

  assertEquals(
    await toText(stream),
    encodeHex(await Deno.readFile("./deno.lock")),
  );
});

Deno.test("HexDecoderStream() decodes stream", async () => {
  const stream = (await Deno.open("./deno.lock"))
    .readable
    .pipeThrough(new HexEncoderStream())
    .pipeThrough(new RandomSliceStream())
    .pipeThrough(new HexDecoderStream());

  assertEquals(
    concat(await Array.fromAsync(stream)),
    await Deno.readFile("./deno.lock"),
  );
});
