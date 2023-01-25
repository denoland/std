// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import {
  assertEquals,
  assertNotEquals,
  assertStrictEquals,
} from "../testing/asserts.ts";
import { BufReader, ReadLineResult } from "../io/buf_reader.ts";
import { dirname, fromFileUrl } from "../path/mod.ts";
import { TextLineStream } from "../streams/text_line_stream.ts";

const moduleDir = dirname(fromFileUrl(import.meta.url));

Deno.test({
  name: "[examples/echo_server]",
  sanitizeResources: false, // TODO(@crowlKats): re-enable once https://github.com/denoland/deno/pull/14686 lands
}, async () => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const process = new Deno.Command(Deno.execPath(), {
    args: ["run", "--quiet", "--allow-net", "echo_server.ts"],
    stdout: "piped",
    stderr: "null",
    cwd: moduleDir,
  });
  const child = process.spawn();
  let conn: Deno.Conn | undefined;
  try {
    const r = child.stdout.pipeThrough(new TextDecoderStream()).pipeThrough(
      new TextLineStream(),
    );
    const reader = r.getReader();
    const res = await reader.read();
    await reader.cancel();

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
    child.kill("SIGTERM");
    await child.status;
    conn?.close();
  }
});
