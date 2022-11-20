// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { readAll } from "../streams/conversion.ts";
import { assert, assertStringIncludes } from "../testing/asserts.ts";

/** Asserts that an error thrown in a callback will not be wrongly caught. */
export async function assertCallbackErrorUncaught(
  { prelude, invocation, cleanup }: {
    /** Any code which needs to run before the actual invocation (notably, any import statements). */
    prelude?: string;
    /**
     * The start of the invocation of the function, e.g. `open("foo.txt", `.
     * The callback will be added after it.
     */
    invocation: string;
    /** Called after the subprocess is finished but before running the assertions, e.g. to clean up created files. */
    cleanup?: () => Promise<void> | void;
  },
) {
  // Since the error has to be uncaught, and that will kill the Deno process,
  // the only way to test this is to spawn a subprocess.
  const p = Deno.run({
    cmd: [
      Deno.execPath(),
      "eval",
      "--unstable",
      `${prelude ?? ""}
  
        ${invocation}(err) => {
          // If the bug is present and the callback is called again with an error,
          // don't throw another error, so if the subprocess fails we know it had the correct behaviour.
          if (!err) throw new Error("success");
        });`,
    ],
    stderr: "piped",
  });
  const status = await p.status();
  const stderr = new TextDecoder().decode(await readAll(p.stderr));
  p.close();
  p.stderr.close();
  await cleanup?.();
  assert(!status.success);
  assertStringIncludes(stderr, "Error: success");
}
