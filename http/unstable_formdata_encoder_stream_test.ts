// Copyright 2018-2026 the Deno authors. MIT license.

import { FormDataEncoderStream } from "@std/http/unstable-formdata-encoder-stream";
import { assert, assertEquals, assertRejects } from "@std/assert";

Deno.test("FormDataEncoderStream", async () => {
  const formData = await new FormDataEncoderStream(ReadableStream
    .from([
      { name: "a", value: "b" },
      {
        name: "c",
        value: new Blob([new Uint8Array(10)]),
      },
      {
        name: "d",
        value: ReadableStream.from([new Uint8Array(20)]),
        filename: "potato.txt",
      },
      { name: "e", value: "f", contentType: "text/plain" },
      {
        name: "g",
        value: new Blob([new Uint8Array(30)], { type: "text/html" }),
      },
    ]))
    .toRequest("https://example.com/", { method: "POST" })
    .formData();

  assertEquals(formData.get("a"), "b");
  const c = formData.get("c");
  assert(c instanceof File);
  assertEquals(c.name, "blob");
  assertEquals(c.type, "application/octet-stream");
  assertEquals(await c.bytes(), new Uint8Array(10));
  const d = formData.get("d");
  assert(d instanceof File);
  assertEquals(d.name, "potato.txt");
  assertEquals(d.type, "application/octet-stream");
  assertEquals(await d.bytes(), new Uint8Array(20));
  assertEquals(formData.get("e"), "f");
  const g = formData.get("g");
  assert(g instanceof File);
  assertEquals(g.name, "blob");
  assertEquals(g.type, "text/html");
  assertEquals(await g.bytes(), new Uint8Array(30));
});

Deno.test(
  "FormDataEncoderStream handles readable entry has error",
  async () => {
    const response = new FormDataEncoderStream(
      ReadableStream.from([{
        name: "a",
        value: new ReadableStream({
          pull(controller) {
            controller.error(new Error("potato"));
          },
        }),
      }]),
    )
      .toResponse();

    await assertRejects(async () => await response.formData(), Error, "potato");
  },
);

Deno.test("FormDataEncoderStream destructuring works correctly", async () => {
  const encoder = FormDataEncoderStream
    .from(ReadableStream.from([{ name: "a", value: "b" }]));

  const formData = await new Response(encoder.readable, {
    headers: { "Content-Type": encoder.contentType },
  }).formData();
  assertEquals(formData.get("a"), "b");
});

Deno.test("FormDataEncoderStream handles small byob requests", async () => {
  const reader = FormDataEncoderStream
    .from(
      ReadableStream.from([{ name: "abcdefghijklmnopqrstuvwxyz", value: "b" }]),
    )
    .readable
    .getReader({ mode: "byob" });

  while (true) {
    const { done, value } = await reader.read(new Uint8Array(5), { min: 5 });
    assert(value != undefined);
    if (done) break;
  }
});

Deno.test(
  "FormDataEncoderStream handles being cancelled correctly",
  async () => {
    await FormDataEncoderStream
      .from(ReadableStream.from([{ name: "a", value: "b" }]))
      .readable
      .cancel();
  },
);

Deno.test(
  "FormDataEncoderStream handles being cancelled midway through",
  async () => {
    const reader = FormDataEncoderStream
      .from(ReadableStream.from([{
        name: "a",
        value: new Blob([new Uint8Array(1024 * 8)]),
      }]))
      .readable
      .getReader({ mode: "byob" });

    const { done, value } = await reader
      .read(new Uint8Array(1024), { min: 1024 });
    assert(done === false);
    assert(value instanceof Uint8Array);

    await reader.cancel();
  },
);
