// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { DelimiterStream } from "./delimiter_stream.ts";
import { assert, assertEquals } from "../testing/asserts.ts";
import { readableStreamFromIterable } from "./readable_stream_from_iterable.ts";

/**
 * Verify that a transform stream produces the expected output data.
 * @param transform The transform stream to test
 * @param inputs Source input data
 * @param outputs Expected output data
 */
async function testTransformStream<T, U>(
  transform: TransformStream<T, U>,
  inputs: Iterable<T> | AsyncIterable<T>,
  outputs: Iterable<U> | AsyncIterable<U>,
) {
  const reader = readableStreamFromIterable(inputs)
    .pipeThrough(transform)
    .getReader();
  for await (const output of outputs) {
    const { value, done } = await reader.read();
    assertEquals(value, output);
    assertEquals(done, false);
  }
  const f = await reader.read();
  assert(f.done, `stream not done, value was: ${f.value}`);
}

Deno.test("[streams] DelimiterStream, discard", async () => {
  const crlf = new TextEncoder().encode("CRLF");
  const delimStream = new DelimiterStream(crlf, { disposition: "discard" });
  const inputs = [
    "qwertzu", // no delimiter
    "iopasdCRLFmnbvc", // one delimiter in the middle
    "xylkjhCRLFgfdsapCRLFoiuzt", // two separate delimiters
    "euoiCRLFCRLFaueiou", // two consecutive delimiters
    "rewq098765432CR", // split delimiter (1/2)
    "LF349012i491290", // split delimiter (2/2)
  ].map((s) => new TextEncoder().encode(s));
  const outputs = [
    "qwertzuiopasd",
    "mnbvcxylkjh",
    "gfdsap",
    "oiuzteuoi",
    "",
    "aueiourewq098765432",
    "349012i491290",
  ].map((s) => new TextEncoder().encode(s));
  await testTransformStream(delimStream, inputs, outputs);
});

Deno.test("[streams] DelimiterStream, suffix", async () => {
  const crlf = new TextEncoder().encode("CRLF");
  const delimStream = new DelimiterStream(crlf, { disposition: "suffix" });
  const inputs = [
    "qwertzu", // no delimiter
    "iopasdCRLFmnbvc", // one delimiter in the middle
    "xylkjhCRLFgfdsapCRLFoiuzt", // two separate delimiters
    "euoiCRLFCRLFaueiou", // two consecutive delimiters
    "rewq098765432CR", // split delimiter (1/2)
    "LF349012i491290", // split delimiter (2/2)
  ].map((s) => new TextEncoder().encode(s));
  const outputs = [
    "qwertzuiopasdCRLF",
    "mnbvcxylkjhCRLF",
    "gfdsapCRLF",
    "oiuzteuoiCRLF",
    "CRLF",
    "aueiourewq098765432CRLF",
    "349012i491290",
  ].map((s) => new TextEncoder().encode(s));
  await testTransformStream(delimStream, inputs, outputs);
});

Deno.test("[streams] DelimiterStream, prefix", async () => {
  const crlf = new TextEncoder().encode("CRLF");
  const delimStream = new DelimiterStream(crlf, { disposition: "prefix" });
  const inputs = [
    "qwertzu", // no delimiter
    "iopasdCRLFmnbvc", // one delimiter in the middle
    "xylkjhCRLFgfdsapCRLFoiuzt", // two separate delimiters
    "euoiCRLFCRLFaueiou", // two consecutive delimiters
    "rewq098765432CR", // split delimiter (1/2)
    "LF349012i491290", // split delimiter (2/2)
  ].map((s) => new TextEncoder().encode(s));
  const outputs = [
    "qwertzuiopasd",
    "CRLFmnbvcxylkjh",
    "CRLFgfdsap",
    "CRLFoiuzteuoi",
    "CRLF",
    "CRLFaueiourewq098765432",
    "CRLF349012i491290",
  ].map((s) => new TextEncoder().encode(s));
  await testTransformStream(delimStream, inputs, outputs);
});
