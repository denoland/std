// Copyright 2022-2022 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";
import { join } from "../path/mod.ts";

const ROOT = new URL(".", import.meta.url).pathname;

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
      join(ROOT, "check_doc_imports.ts"),
      "--test-mode",
    ],
    stdout: "piped",
    stderr: "piped",
  });

  const [status, stdout] = await Promise.all([
    proc.status(),
    proc.output(),
    proc.stderrOutput(),
  ]);
  proc.close();

  assertEquals(status.code, 1);
  const expected = await Deno.readFile(
    join(ROOT, "testdata", "import_check_test_expected_output.txt"),
  );
  assertEquals(
    new TextDecoder().decode(stdout),
    new TextDecoder().decode(expected),
  );
});
