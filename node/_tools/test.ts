import { walk } from "../../fs/walk.ts";
import { magenta } from "../../fmt/colors.ts";
import { dirname, fromFileUrl, join, relative } from "../../path/mod.ts";
import { fail } from "../../testing/asserts.ts";
import { config, testList } from "./common.ts";

/**
 * This script will run the test files specified in the configuration file
 *
 * Each test file will be run independently and wait until completion, if an abnormal
 * code for the test is reported, the test suite will fail immediately
 */

const dir = walk(fromFileUrl(new URL(config.suitesFolder, import.meta.url)), {
  includeDirs: false,
  match: testList,
});
const testsFolder = dirname(fromFileUrl(import.meta.url));
const decoder = new TextDecoder();

for await (const file of dir) {
  Deno.test({
    name: relative(testsFolder, file.path),
    fn: async () => {
      const cmd = [
        Deno.execPath(),
        "run",
        "-A",
        "--quiet",
        "--unstable",
        "--no-check",
        join("node", "_tools", "require.ts"),
        file.path,
      ];
      // Pipe stdout in order to output each test result as Deno.test output
      // That way the tests will respect the `--quiet` option when provided
      const test = Deno.run({
        cmd,
        stderr: "piped",
        stdout: "piped",
      });

      const [rawStderr, rawOutput, status] = await Promise.all([
        test.stderrOutput(),
        test.output(),
        test.status(),
      ]);
      test.close();

      const stderr = decoder.decode(rawStderr);
      if (rawStderr.length) console.error(stderr);
      if (rawOutput.length) console.log(decoder.decode(rawOutput));

      if (status.code !== 0) {
        console.log(`Error: "${file.path}" failed`);
        console.log(
          "You can repeat only this test with the command:",
          magenta(cmd.join(" ")),
        );
        fail(stderr);
      }
    },
  });
}

function checkConfigTestFilesOrder(testFileLists: Array<string[]>) {
  for (const testFileList of testFileLists) {
    const sortedTestList = JSON.parse(JSON.stringify(testFileList));
    sortedTestList.sort();
    if (JSON.stringify(testFileList) !== JSON.stringify(sortedTestList)) {
      throw new Error(
        `File names in \`config.json\` are not correct order.`,
      );
    }
  }
}

Deno.test("checkConfigTestFilesOrder", function () {
  checkConfigTestFilesOrder([
    ...Object.keys(config.ignore).map((suite) => config.ignore[suite]),
    ...Object.keys(config.tests).map((suite) => config.tests[suite]),
  ]);
});
