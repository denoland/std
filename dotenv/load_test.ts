// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../testing/asserts.ts";
import * as path from "../path/mod.ts";

const moduleDir = path.dirname(path.fromFileURL(import.meta.url));
const testdataDir = path.resolve(moduleDir, "testdata");

Deno.test({
  name: "load",
  async fn() {
    const { stdout } = await Deno.spawn(Deno.execPath(), {
      args: [
        "run",
        "--allow-read",
        "--allow-env",
        path.join(testdataDir, "./app_load.ts"),
      ],
      cwd: testdataDir,
    });

    const decoder = new TextDecoder();
    assertEquals(
      decoder.decode(stdout).trim(),
      "hello world",
    );
  },
});

Deno.test({
  name: "load when multiple files",
  async fn() {
    const { stdout } = await Deno.spawn(Deno.execPath(), {
      args: [
        "run",
        "--allow-read",
        "--allow-env",
        path.join(testdataDir, "./app_load_parent.ts"),
      ],
      cwd: testdataDir,
    });

    const decoder = new TextDecoder();
    assertEquals(
      decoder.decode(stdout).trim(),
      "hello world",
    );
  },
});
