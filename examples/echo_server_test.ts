// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import {
  assertEquals,
  assertNotEquals,
  assertStrictEquals,
} from "../testing/asserts.ts";
import { BufReader, ReadLineResult } from "../io/buffer.ts";
import { dirname, fromFileUrl } from "../path/mod.ts";
import { TextLineStream } from "../streams/delimiter.ts";

const moduleDir = dirname(fromFileUrl(import.meta.url));

Deno.test("[examples/echo_server]", async () => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const process = Deno.spawnChild(Deno.execPath(), {
    args: ["run", "--quiet", "--allow-net", "echo_server.ts"],
    cwd: moduleDir,
  });

  let conn: Deno.Conn | undefined;
  try {
    const r = process.stdout.pipeThrough(new TextDecoderStream()).pipeThrough(
      new TextLineStream(),
    );
    const reader = r.getReader();
    const res = await reader.read();
    reader.cancel();

    assertEquals(res.done, false);
    assertStrictEquals(res.value!.trim(), "Listening on http://localhost:8080");

    conn = await Deno.connect({ hostname: "127.0.0.1", port: 8080 });
    const connReader = new BufReader(conn);

    await conn.write(encoder.encode("Hello echo_server\n"));
    const result = await connReader.readLine();

    assertNotEquals(result, null);

    const actualResponse = decoder
      .decode((result as ReadLineResult).line)
      .trim();
    const expectedResponse = "Hello echo_server";

    assertStrictEquals(actualResponse, expectedResponse);
  } finally {
    conn?.close();
  }
});
