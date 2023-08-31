// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { DelimiterStream } from "./delimiter_stream.ts";
import { testTransformStream } from "./_test_common.ts";

const DELIMITER_STREAM_INPUTS = [
  "a", // more than one subsequent chunks with no delimiters
  "b", // more than one subsequent chunks with no delimiters
  "cCRLF", // more than one subsequent chunks with no delimiters
  "CRLF", // chunk with only delimiter
  "qwertzu", // no delimiter
  "iopasdCRLFmnbvc", // one delimiter in the middle
  "xylkjhCRLFgfdsapCRLFoiuzt", // two separate delimiters
  "euoiCRLFCRLFaueiou", // two consecutive delimiters
  "rewq098765432CR", // split delimiter (1/2)
  "LF349012i491290", // split delimiter (2/2)
  "asdfghjkliopCR", // split delimiter with followup (1/2)
  "LFytrewqCRLFmnbvcxz", // split delimiter with followup (2/2)
  "CRLFasd", // chunk starts with delimiter
].map((s) => new TextEncoder().encode(s));

Deno.test("[streams] DelimiterStream, discard", async () => {
  const crlf = new TextEncoder().encode("CRLF");
  const delimStream = new DelimiterStream(crlf, { disposition: "discard" });
  const outputs = [
    "abc",
    "",
    "qwertzuiopasd",
    "mnbvcxylkjh",
    "gfdsap",
    "oiuzteuoi",
    "",
    "aueiourewq098765432",
    "349012i491290asdfghjkliop",
    "ytrewq",
    "mnbvcxz",
    "asd",
  ].map((s) => new TextEncoder().encode(s));
  await testTransformStream(delimStream, DELIMITER_STREAM_INPUTS, outputs);
});

Deno.test("[streams] DelimiterStream, suffix", async () => {
  const crlf = new TextEncoder().encode("CRLF");
  const delimStream = new DelimiterStream(crlf, { disposition: "suffix" });
  const outputs = [
    "abcCRLF",
    "CRLF",
    "qwertzuiopasdCRLF",
    "mnbvcxylkjhCRLF",
    "gfdsapCRLF",
    "oiuzteuoiCRLF",
    "CRLF",
    "aueiourewq098765432CRLF",
    "349012i491290asdfghjkliopCRLF",
    "ytrewqCRLF",
    "mnbvcxzCRLF",
    "asd",
  ].map((s) => new TextEncoder().encode(s));
  await testTransformStream(delimStream, DELIMITER_STREAM_INPUTS, outputs);
});

Deno.test("[streams] DelimiterStream, prefix", async () => {
  const crlf = new TextEncoder().encode("CRLF");
  const delimStream = new DelimiterStream(crlf, { disposition: "prefix" });
  const outputs = [
    "abc",
    "CRLF",
    "CRLFqwertzuiopasd",
    "CRLFmnbvcxylkjh",
    "CRLFgfdsap",
    "CRLFoiuzteuoi",
    "CRLF",
    "CRLFaueiourewq098765432",
    "CRLF349012i491290asdfghjkliop",
    "CRLFytrewq",
    "CRLFmnbvcxz",
    "CRLFasd",
  ].map((s) => new TextEncoder().encode(s));
  await testTransformStream(delimStream, DELIMITER_STREAM_INPUTS, outputs);
});
