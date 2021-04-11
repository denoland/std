import { walk } from "../../fs/walk.ts";
import { dirname, fromFileUrl, relative } from "../../path/mod.ts";
import { assertEquals } from "../../testing/asserts.ts";
import { config, testList } from "./common.ts";

/**
 * This script will run the test files specified in the configuration file
 *
 * Each test file will be run independently and wait until completion, if an abnormal
 * code for the test is reported, the test suite will fail inmediately
 */
const decoder = new TextDecoder();

const dir = walk(fromFileUrl(new URL(config.suitesFolder, import.meta.url)), {
  includeDirs: false,
  match: testList,
});

const testsFolder = dirname(fromFileUrl(import.meta.url));

for await (const file of dir) {
  Deno.test({
    name: relative(testsFolder, file.path),
    fn: async () => {
      const process = Deno.run({
        cwd: testsFolder,
        cmd: [
          "deno",
          "run",
          "-A",
          "--quiet",
          "--unstable",
          "require.ts",
          file.path,
        ],
        stderr: "piped",
      });

      const { code } = await process.status();
      const errorMessage = decoder.decode(await Deno.readAll(process.stderr));
      process.close();
      process.stderr.close();

      assertEquals(code, 0, errorMessage);
    },
  });
}
