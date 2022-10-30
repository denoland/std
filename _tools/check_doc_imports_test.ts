// Copyright 2022-2022 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";
import { isWindows } from "../_util/os.ts";

const ROOT = new URL(import.meta.url);

Deno.test("doc import checker process should exit with code 1 and print warnings", async () => {
  const proc = await Deno.run({
    env: {
      NO_COLOR: "true",
    },
    cmd: [
      "deno",
      "run",
      "--allow-env",
      "--allow-read",
      new URL("./check_doc_imports.ts", ROOT).toString(),
      "--test-mode",
    ],
    stdout: "piped",
    stderr: "piped",
  });
  const expected = await Deno.readFile(
    new URL(
      `./testdata/import_check_${isWindows ? "win32" : "posix"}.txt`,
      ROOT,
    ),
  );
  const [{ code }, stdout, stderr] = await Promise.all([
    proc.status(),
    proc.output(),
    proc.stderrOutput(),
  ]);
  proc.close();

  assertEquals(code, 1);
  assertEquals(new TextDecoder().decode(stderr), "");
  assertEquals(
    new TextDecoder().decode(stdout),
    new TextDecoder().decode(expected),
  );
});
