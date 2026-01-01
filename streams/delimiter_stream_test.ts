// Copyright 2018-2026 the Deno authors. MIT license.

import { DelimiterStream } from "./delimiter_stream.ts";
import { testTransformStream } from "./_test_utils.ts";

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

Deno.test("DelimiterStream handles { disposition: discard } correctly", async () => {
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

Deno.test("DelimiterStream handles { dispositioin: suffix } correctly", async () => {
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

Deno.test("DelimiterStream handles { dispositioin: prefix } correctly", async () => {
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

Deno.test("DelimiterStream handles { dispositioin: prefix } correctly when chunk starting with delimiter", async () => {
  const crlf = new TextEncoder().encode("CRLF");
  const delimStream = new DelimiterStream(crlf, { disposition: "prefix" });
  const inputs = [
    "CRLF123",
    "4",
    "5",
    "CRLF67890CR",
    "LF",
  ].map((s) => new TextEncoder().encode(s));
  const outputs = [
    "",
    "CRLF12345",
    "CRLF67890",
    "CRLF",
  ].map((s) => new TextEncoder().encode(s));
  await testTransformStream(delimStream, inputs, outputs);
});

const CHAR_DELIMITER_STREAM_INPUTS = [
  "a", // more than one subsequent chunks with no delimiters
  "b", // more than one subsequent chunks with no delimiters
  "c_", // more than one subsequent chunks with no delimiters
  "_", // chunk with only delimiter
  "qwertzu", // no delimiter
  "iopasd_mnbvc", // one delimiter in the middle
  "xylkjh_gfdsap_oiuzt", // two separate delimiters
  "euoi__aueiou", // two consecutive delimiters
  "rewq098765432", // more than one intermediate chunks with no delimiters
  "349012i491290", // more than one intermediate chunks with no delimiters
  "asdfghjkliop", // more than one intermediate chunks with no delimiters
  "ytrewq_mnbvcxz", // one delimiter in the middle after multiple chunks with no delimiters
  "_asd", // chunk starts with delimiter
].map((s) => new TextEncoder().encode(s));

Deno.test("DelimiterStream, with char delimiter, handles { disposition: discard } option correctly", async () => {
  const delim = new TextEncoder().encode("_");
  const delimStream = new DelimiterStream(delim, { disposition: "discard" });
  const outputs = [
    "abc",
    "",
    "qwertzuiopasd",
    "mnbvcxylkjh",
    "gfdsap",
    "oiuzteuoi",
    "",
    "aueiourewq098765432349012i491290asdfghjkliopytrewq",
    "mnbvcxz",
    "asd",
  ].map((s) => new TextEncoder().encode(s));
  await testTransformStream(delimStream, CHAR_DELIMITER_STREAM_INPUTS, outputs);
});

Deno.test("DelimiterStream, with char delimiter, handles { disposition: suffix } option correctly", async () => {
  const delim = new TextEncoder().encode("_");
  const delimStream = new DelimiterStream(delim, { disposition: "suffix" });
  const outputs = [
    "abc_",
    "_",
    "qwertzuiopasd_",
    "mnbvcxylkjh_",
    "gfdsap_",
    "oiuzteuoi_",
    "_",
    "aueiourewq098765432349012i491290asdfghjkliopytrewq_",
    "mnbvcxz_",
    "asd",
  ].map((s) => new TextEncoder().encode(s));
  await testTransformStream(delimStream, CHAR_DELIMITER_STREAM_INPUTS, outputs);
});

Deno.test("DelimiterStream, with char delimiter, handles { disposition: prefix } option correctly", async () => {
  const delim = new TextEncoder().encode("_");
  const delimStream = new DelimiterStream(delim, { disposition: "prefix" });
  const outputs = [
    "abc",
    "_",
    "_qwertzuiopasd",
    "_mnbvcxylkjh",
    "_gfdsap",
    "_oiuzteuoi",
    "_",
    "_aueiourewq098765432349012i491290asdfghjkliopytrewq",
    "_mnbvcxz",
    "_asd",
  ].map((s) => new TextEncoder().encode(s));
  await testTransformStream(delimStream, CHAR_DELIMITER_STREAM_INPUTS, outputs);
});

Deno.test("DelimiterStream, with char delimiter, handles { disposition: prefix } option correctly when chunk starting with delimiter", async () => {
  const delim = new TextEncoder().encode("_");
  const delimStream = new DelimiterStream(delim, { disposition: "prefix" });
  const inputs = [
    "_ab_ab",
    "_cd_cd",
  ].map((s) => new TextEncoder().encode(s));
  const outputs = [
    "",
    "_ab",
    "_ab",
    "_cd",
    "_cd",
  ].map((s) => new TextEncoder().encode(s));
  await testTransformStream(delimStream, inputs, outputs);
});

Deno.test("DelimiterStream regression 3609", async () => {
  const delimStream = new DelimiterStream(new TextEncoder().encode(";"));
  const inputs = [
    ";ab;fg;hn;j",
    "k;lr;op;rt;;",
  ].map((s) => new TextEncoder().encode(s));
  const outputs = [
    "",
    "ab",
    "fg",
    "hn",
    "jk",
    "lr",
    "op",
    "rt",
    "",
    "",
  ].map((s) => new TextEncoder().encode(s));
  await testTransformStream(delimStream, inputs, outputs);
});

Deno.test("DelimiterStream handles multiple chunks with no delimiters correctly", async () => {
  // This tests flush implementation
  const delimStream = new DelimiterStream(new TextEncoder().encode("|"));
  const inputs = [
    "a|b|c",
    "d",
    "e",
    "f",
    "|g",
    "h",
    "i",
  ].map((s) => new TextEncoder().encode(s));
  const outputs = [
    "a",
    "b",
    "cdef",
    "ghi",
  ].map((s) => new TextEncoder().encode(s));
  await testTransformStream(delimStream, inputs, outputs);
});

Deno.test("DelimiterStream handles delimiter AAB correctly when the input has AAABA", async () => {
  // This tests flush implementation
  const delimStream = new DelimiterStream(new TextEncoder().encode("AAB"));
  const inputs = [
    "AAABA",
  ].map((s) => new TextEncoder().encode(s));
  const outputs = [
    "A",
    "A",
  ].map((s) => new TextEncoder().encode(s));
  await testTransformStream(delimStream, inputs, outputs);
});
