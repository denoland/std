// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";
import * as path from "../path/mod.ts";

const moduleDir = path.dirname(path.fromFileUrl(import.meta.url));
const testdataDir = path.resolve(moduleDir, "testdata");

const decoder = new TextDecoder();

Deno.test("load env", async () => {
  const p = Deno.run({
    cmd: [
      Deno.execPath(),
      "run",
      "--allow-read",
      "--allow-env",
      path.join(testdataDir, "./load_env.ts"),
    ],
    cwd: testdataDir,
    stdout: "piped",
  });
  const rawOutput = await p.output();
  assertEquals(
    decoder.decode(rawOutput),
    "hello world\n",
  );
  p.close();
});

Deno.test("load parent env", async () => {
  const p = Deno.run({
    cmd: [
      Deno.execPath(),
      "run",
      "--allow-read",
      "--allow-env",
      path.join(testdataDir, "./load_parent_env.ts"),
    ],
    cwd: testdataDir,
    stdout: "piped",
  });
  const rawOutput = await p.output();
  assertEquals(
    decoder.decode(rawOutput),
    "hello world\n",
  );
  p.close();
});
