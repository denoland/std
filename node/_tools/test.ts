// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { magenta } from "../../fmt/colors.ts";
import { dirname, fromFileUrl, join } from "../../path/mod.ts";
import { fail } from "../../testing/asserts.ts";
import { config, getPathsFromTestSuites } from "./common.ts";

// If the test case is invoked like
// deno test -A node/_tools/test.ts -- <test-names>
// Use the test-names as filters
const filters = Deno.args;

/**
 * This script will run the test files specified in the configuration file
 *
 * Each test file will be run independently and wait until completion, if an abnormal
 * code for the test is reported, the test suite will fail immediately
 */

const toolsPath = dirname(fromFileUrl(import.meta.url));
const stdRootUrl = new URL("../../", import.meta.url).href;
const testPaths = getPathsFromTestSuites(config.tests);
const cwd = fromFileUrl(new URL("./", import.meta.url));
const requireTs = "require.ts";
const importMap = "import_map.json";
const windowsIgnorePaths = new Set(
  getPathsFromTestSuites(config.windowsIgnore),
);
const darwinIgnorePaths = new Set(
  getPathsFromTestSuites(config.darwinIgnore),
);

const decoder = new TextDecoder();

for await (const path of testPaths) {
  // If filter patterns are given and any pattern doesn't match
  // to the file path, then skip the case
  if (
    filters.length > 0 &&
    filters.every((pattern) => !path.includes(pattern))
  ) {
    continue;
  }
  const ignore =
    (Deno.build.os === "windows" && windowsIgnorePaths.has(path)) ||
    (Deno.build.os === "darwin" && darwinIgnorePaths.has(path));
  Deno.test({
    name: `Node.js compatibility "${path}"`,
    ignore,
    fn: async () => {
      const targetTestPath = join(toolsPath, config.suitesFolder, path);

      const v8Flags = ["--stack-size=4000"];
      const testSourceCode = await Deno.readTextFile(targetTestPath);
      // TODO(kt3k): Parse `Flags` directive correctly
      if (testSourceCode.includes("Flags: --expose_externalize_string")) {
        v8Flags.push("--expose-externalize-string");
      }

      const args = [
        "run",
        "-A",
        "--quiet",
        "--unstable",
        "--unsafely-ignore-certificate-errors",
        "--v8-flags=" + v8Flags.join(),
        targetTestPath.endsWith(".mjs")
          ? "--import-map=" + importMap
          : requireTs,
        targetTestPath,
      ];

      // Pipe stdout in order to output each test result as Deno.test output
      // That way the tests will respect the `--quiet` option when provided
      const command = new Deno.Command(Deno.execPath(), {
        args,
        env: {
          DENO_NODE_COMPAT_URL: stdRootUrl,
        },
        cwd,
      });
      const { code, stdout, stderr } = await command.output();

      const decodedStderr = decoder.decode(stderr);
      if (stderr.length) console.error(decodedStderr);
      if (stdout.length) console.log(decoder.decode(stdout));

      if (code !== 0) {
        console.log(`Error: "${path}" failed`);
        console.log(
          "You can repeat only this test with the command:",
          magenta(`deno test -A node/_tools/test.ts -- ${path}`),
        );
        fail(decodedStderr);
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
