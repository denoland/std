import { walk } from "../../fs/walk.ts";
import { dirname, fromFileUrl } from "../../path/mod.ts";
import { config, testList } from "./common.ts";

/**
 * This script will run the test files specified in the configuration file
 * 
 * Each test file will be run independently and wait until completion, if an abnormal
 * code for the test is reported, the test suite will fail inmediately
 * 
 * Usage: `deno run --allow-run --allow-read runner.ts`
 */

const dir = walk(fromFileUrl(new URL(config.suitesFolder, import.meta.url)), {
  includeDirs: false,
  match: testList,
});

for await (const file of dir) {
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

  if (code === 0) {
    console.log(`${file.path} ....... OK`);
  } else {
    Deno.exit(code);
  }
}
