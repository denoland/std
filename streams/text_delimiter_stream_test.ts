// Copyright 2018-2026 the Deno authors. MIT license.

import { TextDelimiterStream } from "./text_delimiter_stream.ts";
import { testTransformStream } from "./_test_utils.ts";

Deno.test("TextDelimiterStream handles discard", async () => {
  const delimStream = new TextDelimiterStream("foo", {
    disposition: "discard",
  });
  const inputs = [
    "qwertzu", // no delimiter
    "iopasdfoomnbvc", // one delimiter in the middle
    "xylkjhfoogfdsapfoooiuzt", // two separate delimiters
    "euoifoofooaueiou", // two consecutive delimiters
    "rewq098765432fo", // split delimiter (1/2)
    "o349012i491290", // split delimiter (2/2)
  ];
  const outputs = [
    "qwertzuiopasd",
    "mnbvcxylkjh",
    "gfdsap",
    "oiuzteuoi",
    "",
    "aueiourewq098765432",
    "349012i491290",
  ];

  await testTransformStream(delimStream, inputs, outputs);
});

Deno.test("TextDelimiterStream handles suffix", async () => {
  const delimStream = new TextDelimiterStream("foo", {
    disposition: "suffix",
  });
  const inputs = [
    "qwertzu", // no delimiter
    "iopasdfoomnbvc", // one delimiter in the middle
    "xylkjhfoogfdsapfoooiuzt", // two separate delimiters
    "euoifoofooaueiou", // two consecutive delimiters
    "rewq098765432fo", // split delimiter (1/2)
    "o349012i491290", // split delimiter (2/2)
  ];
  const outputs = [
    "qwertzuiopasdfoo",
    "mnbvcxylkjhfoo",
    "gfdsapfoo",
    "oiuzteuoifoo",
    "foo",
    "aueiourewq098765432foo",
    "349012i491290",
  ];

  await testTransformStream(delimStream, inputs, outputs);
});

Deno.test("TextDelimiterStream handles prefix", async () => {
  const delimStream = new TextDelimiterStream("foo", {
    disposition: "prefix",
  });
  const inputs = [
    "qwertzu", // no delimiter
    "iopasdfoomnbvc", // one delimiter in the middle
    "xylkjhfoogfdsapfoooiuzt", // two separate delimiters
    "euoifoofooaueiou", // two consecutive delimiters
    "rewq098765432fo", // split delimiter (1/2)
    "o349012i491290", // split delimiter (2/2)
  ];
  const outputs = [
    "qwertzuiopasd",
    "foomnbvcxylkjh",
    "foogfdsap",
    "foooiuzteuoi",
    "foo",
    "fooaueiourewq098765432",
    "foo349012i491290",
  ];

  await testTransformStream(delimStream, inputs, outputs);
});

Deno.test("TextDelimiterStream handles JSONL with an empty line in the middle and trailing newline", async () => {
  const delimStream = new TextDelimiterStream("\n");

  const inputs = [
    '{"a": 1}\n',
    '\n{"a',
    '": 2, "b": true}\n',
  ];
  const outputs = [
    '{"a": 1}',
    "",
    '{"a": 2, "b": true}',
    "",
  ];

  await testTransformStream(delimStream, inputs, outputs);
});
