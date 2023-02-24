// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import {
  assertEquals,
  assertRejects,
  assertThrows,
} from "../testing/asserts.ts";
import { readableStreamFromIterable } from "./readable_stream_from_iterable.ts";
import { transformStreamFromProcess } from "./transform_stream_from_process.ts";

async function streamToText(
  stream: ReadableStream<Uint8Array>,
): Promise<string> {
  const s = stream
    .pipeThrough(new TextDecoderStream());

  let result = "";
  for await (const chunk of s) {
    result += chunk;
  }
  return result;
}

function evalProcess(
  code: string,
  stdin: "piped" | "null" = "piped",
  stdout: "piped" | "null" = "piped",
) {
  return Deno.run({ cmd: [Deno.execPath(), "eval", code], stdout, stdin });
}

function testProcess(
  stdin: "piped" | "null" = "piped",
  stdout: "piped" | "null" = "piped",
) {
  return evalProcess(
    `
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  for await (const chunk of Deno.stdin.readable) {
    Deno.stdout.write(encoder.encode(decoder.decode(chunk).toUpperCase()));
  }
  `,
    stdin,
    stdout,
  );
}

function testErrorProcess(status: number) {
  return evalProcess(`Deno.exit(${status});`);
}

Deno.test({
  name: "[streams] transformStreamFromProcess()",
  async fn() {
    const resultStream = readableStreamFromIterable(["hello ", "world"])
      .pipeThrough(new TextEncoderStream())
      .pipeThrough(transformStreamFromProcess(testProcess()));

    const result = await streamToText(resultStream);

    assertEquals(result, "HELLO WORLD");
  },
});

Deno.test({
  name:
    "[streams] transformStreamFromProcess() Propagate the error from process",
  async fn() {
    const transform = transformStreamFromProcess(testErrorProcess(1), {
      throwIfStatusError: true,
    });

    const resultStream = readableStreamFromIterable(["hello ", "world"])
      .pipeThrough(new TextEncoderStream())
      .pipeThrough(transform);

    await assertRejects(
      () =>
        streamToText(resultStream).then((text) => {
          console.log("text", text);
        }, (e) => {
          console.log("error", e);
          throw e;
        }),
      "process exited with status 1",
    );
  },
});

Deno.test({
  name:
    "[streams] transformStreamFromProcess() fail with not piped stdin & stdout",
  async fn() {
    const expectedError = "stdin and stdout must be piped";

    async function test(stdin: "piped" | "null", stdout: "piped" | "null") {
      const process = testProcess(stdin, stdout);
      try {
        await assertThrows(
          () => transformStreamFromProcess(process),
          expectedError,
        );
      } finally {
        process.stdin?.close();
        process.stdout?.close();
        process.close();
      }
    }

    await test("null", "piped");
    await test("piped", "null");
    await test("null", "null");
  },
});
