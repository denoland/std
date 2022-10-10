// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { xeval } from "./xeval.ts";
import { assertEquals, assertStringIncludes } from "../testing/asserts.ts";
import { dirname, fromFileUrl } from "../path/mod.ts";

const moduleDir = dirname(fromFileUrl(import.meta.url));

function createReadableStream(str: string) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(str));
      controller.close();
    },
  });
}

Deno.test("xevalSuccess", async function () {
  const chunks: string[] = [];
  await xeval(createReadableStream("a\nb\nc"), ($): number => chunks.push($));
  assertEquals(chunks, ["a", "b", "c"]);
});

Deno.test("xevalDelimiter", async function () {
  const chunks: string[] = [];
  await xeval(
    createReadableStream("!MADMADAMADAM!"),
    ($): number => chunks.push($),
    {
      delimiter: "MADAM",
    },
  );
  assertEquals(chunks, ["!MAD", "ADAM!"]);
});

const xevalPath = "xeval.ts";

Deno.test({
  name: "xevalCliReplvar",
  fn: async function () {
    const p = Deno.spawnChild(Deno.execPath(), {
      args: [
        "run",
        "--quiet",
        xevalPath,
        "--replvar=abc",
        "console.log(abc)",
      ],
      cwd: moduleDir,
      stdin: "piped",
      stderr: "null",
    });
    const writer = p.stdin.getWriter();
    await writer.write(new TextEncoder().encode("hello"));
    await writer.close();
    const { success, stdout } = await p.output();
    assertEquals(success, true);
    assertEquals(new TextDecoder().decode(stdout).trimEnd(), "hello");
  },
});

Deno.test("xevalCliSyntaxError", async function () {
  const { code, success, stdout, stderr } = await Deno.spawn(Deno.execPath(), {
    args: ["run", "--quiet", xevalPath, "("],
    cwd: moduleDir,
  });
  const decoder = new TextDecoder();
  assertEquals(code, 1);
  assertEquals(success, false);
  assertEquals(decoder.decode(stdout), "");
  assertStringIncludes(decoder.decode(stderr), "SyntaxError");
});
