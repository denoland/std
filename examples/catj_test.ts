// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertStrictEquals } from "../testing/asserts.ts";
import { dirname, fromFileUrl } from "../path/mod.ts";

const moduleDir = dirname(fromFileUrl(import.meta.url));

Deno.test("[examples/catj] print an array", async () => {
  const decoder = new TextDecoder();
  const process = catj("testdata/catj/array.json");

  await process.stdin.close();
  const { stdout } = await process.output();
  const actual = decoder.decode(stdout).trim();
  const expected = [
    '.[0] = "string"',
    ".[1] = 100",
    '.[2].key = "value"',
    '.[2].array[0] = "foo"',
    '.[2].array[1] = "bar"',
  ].join("\n");

  assertStrictEquals(actual, expected);
});

Deno.test("[examples/catj] print an object", async () => {
  const decoder = new TextDecoder();
  const process = catj("testdata/catj/object.json");

  await process.stdin.close();
  const { stdout } = await process.output();
  const actual = decoder.decode(stdout).trim();
  const expected = [
    '.string = "foobar"',
    ".number = 123",
    '.array[0].message = "hello"',
  ].join("\n");

  assertStrictEquals(actual, expected);
});

Deno.test("[examples/catj] print multiple files", async () => {
  const decoder = new TextDecoder();
  const process = catj(
    "testdata/catj/simple-object.json",
    "testdata/catj/simple-array.json",
  );

  await process.stdin.close();
  const { stdout } = await process.output();
  const actual = decoder.decode(stdout).trim();
  const expected = ['.message = "hello"', ".[0] = 1", ".[1] = 2"].join("\n");

  assertStrictEquals(actual, expected);
});

Deno.test("[examples/catj] read from stdin", async () => {
  const decoder = new TextDecoder();
  const process = catj("-");
  const input = `{ "foo": "bar" }`;

  const writer = process.stdin.getWriter();
  await writer.write(new TextEncoder().encode(input));
  writer.releaseLock();
  await process.stdin.close();
  const { stdout } = await process.output();
  const actual = decoder.decode(stdout).trim();

  assertStrictEquals(actual, '.foo = "bar"');
});

function catj(...files: string[]): Deno.ChildProcess {
  const process = new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "--quiet",
      "--allow-read",
      "catj.ts",
      ...files,
    ],
    cwd: moduleDir,
    stdin: "piped",
    stdout: "piped",
    env: { NO_COLOR: "true" },
  });
  return process.spawn();
}
