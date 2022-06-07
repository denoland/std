// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../testing/asserts.ts";
import * as path from "../path/mod.ts";

const moduleDir = path.dirname(path.fromFileUrl(import.meta.url));
const testdataDir = path.resolve(moduleDir, "testdata/_config");

Deno.test({
  name: "load",
  permissions: { read: true, env: true },
  async fn() {
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

    const decoder = new TextDecoder();
    const output = await p.output();
    assertEquals(
      decoder.decode(output).trim(),
      "hello world",
    );
    p.close();
  },
});

Deno.test({
  name: "load when multiple files",
  permissions: { read: true, env: true },
  async fn() {
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

    const decoder = new TextDecoder();
    const output = await p.output();
    assertEquals(
      decoder.decode(output).trim(),
      "hello world",
    );
    p.close();
  },
});
Deno.test({
  name: "deploy",
  permissions: { read: true, env: true },
  async fn() {
    const p = Deno.run({
      cmd: [
        Deno.execPath(),
        "run",
        "--allow-read",
        "--allow-env",
        path.join(testdataDir, "./deploy_env.ts"),
      ],
      cwd: testdataDir,
      stderr: "piped",
    });

    const decoder = new TextDecoder();
    const output = await p.stderrOutput();

    assertEquals(
      decoder.decode(output).trim(),
      "Deno.readTextFileSync is not a function: No .env data was read.",
    );

    p.close();
  },
});
