// Copyright 2022-2022 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";

const ROOT = new URL(".", import.meta.url);

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

  const [status, stdout] = await Promise.all([
    proc.status(),
    proc.output(),
    proc.stderrOutput(),
  ]);
  proc.close();

  assertEquals(status.code, 1);
  const expected = await Deno.readFile(
    new URL("./testdata/import_check_test_expected_output.txt", ROOT),
  );
  assertEquals(
    new TextDecoder().decode(stdout),
    new TextDecoder().decode(expected),
  );
});
