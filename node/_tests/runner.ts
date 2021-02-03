import { walk } from "../../fs/walk.ts";
import { dirname, fromFileUrl, relative } from "../../path/mod.ts";

// By default this will assume all tests are inside parallel
const dir = walk(fromFileUrl(new URL("./parallel", import.meta.url)), {
  includeDirs: false,
});

for await (const file of dir) {
  const path = relative(fromFileUrl(import.meta.url), file.path);

  const process = Deno.run({
    cwd: dirname(fromFileUrl(import.meta.url)),
    cmd: [
      "deno",
      "run",
      "-A",
      "--unstable",
      "require.ts",
      file.path,
    ],
  });

  const { code } = await process.status();

  if (code !== 0) {
    throw new Error(`Execution failed on ${path}`);
  }
}
