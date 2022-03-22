// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../testing/asserts.ts";
import * as path from "../path/mod.ts";

const moduleDir = path.dirname(path.fromFileUrl(import.meta.url));
const testdataDir = path.resolve(moduleDir, "testdata");

Deno.test({
  name: "load",
  async fn() {
    const p = Deno.run({
      cmd: [
        Deno.execPath(),
        "run",
        "--allow-read",
        "--allow-env",
        path.join(testdataDir, "./app_load.ts"),
      ],
      cwd: testdataDir,
      stdout: "piped",
    });

    const decoder = new TextDecoder();
    const rawOutput = await p.output();
    assertEquals(
      decoder.decode(rawOutput).trim(),
      "hello world",
    );
    p.close();
  },
});

Deno.test({
  name: "load when multiple files",
  async fn() {
    const p = Deno.run({
      cmd: [
        Deno.execPath(),
        "run",
        "--allow-read",
        "--allow-env",
        path.join(testdataDir, "./app_load_parent.ts"),
      ],
      cwd: testdataDir,
      stdout: "piped",
    });

    const decoder = new TextDecoder();
    const rawOutput = await p.output();
    assertEquals(
      decoder.decode(rawOutput).trim(),
      "hello world",
    );
    p.close();
  },
});
