import { assert, assertEquals } from "../testing/asserts.ts";
import { dirname, fromFileUrl } from "../path/mod.ts";

/** The utility for running "node/main.ts" with the given args */
async function runNodeMain(...args: string[]) {
  const p = Deno.run({
    cmd: [
      Deno.execPath(),
      "run",
      "--allow-read",
      "--unstable",
      "main.ts",
      ...args,
    ],
    stdout: "piped",
    stderr: "piped",
    cwd: dirname(fromFileUrl(new URL(import.meta.url))),
  });

  const [status, output, stderrOutput] = await Promise.all([
    p.status(),
    p.output(),
    p.stderrOutput(),
  ]);

  const decoder = new TextDecoder();

  p.close();

  return {
    status,
    output: decoder.decode(output),
    stderrOutput: decoder.decode(stderrOutput),
  };
}

Deno.test("[node/main] run node.js script", async () => {
  const { status, output } = await runNodeMain("_module/example.js");
  assertEquals(status.code, 0);
  assertEquals(output, "  foo\n");
});

Deno.test("[node/main] --help", async () => {
  const { status, output } = await runNodeMain("--help");
  assertEquals(status.code, 0);
  assert(output.includes("Usage:"));
});

Deno.test("[node/main] exec with no arg", async () => {
  const { status, output } = await runNodeMain();
  assertEquals(status.code, 1); // Error
  assert(output.includes("Usage:")); // Shows the usage
});
