// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";
import { isWindows } from "../_util/os.ts";

const ROOT = new URL(import.meta.url);

Deno.test("doc import checker process should exit with code 1 and print warnings", async () => {
  const command = new Deno.Command(Deno.execPath(), {
    env: {
      NO_COLOR: "true",
    },
    args: [
      "run",
      "--allow-env",
      "--allow-read",
      new URL("./check_doc_imports.ts", ROOT).toString(),
      "--test-mode",
    ],
    stderr: "null",
  });
  const { code, stdout } = await command.output();
  const expected = await Deno.readFile(
    new URL(
      `./testdata/import_check_${isWindows ? "win32" : "posix"}.txt`,
      ROOT,
    ),
  );

  assertEquals(code, 1);
  assertEquals(
    new TextDecoder().decode(stdout),
    new TextDecoder().decode(expected),
  );
});
