import { walk } from "../../fs/walk.ts";
import { dirname, fromFileUrl, relative } from "../../path/mod.ts";
import { assertEquals } from "../../testing/asserts.ts";
import { config, testList } from "./common.ts";

/**
 * This script will run the test files specified in the configuration file
 *
 * Each test file will be run independently and wait until completion, if an abnormal
 * code for the test is reported, the test suite will fail immediately
 */

const onlyFlagTestList: RegExp[] = [];

function makeOnlyFlagTestList(testLists: Array<string[]>) {
  for (const testList of testLists) {
    const hasOnlyFlagTestList = testList.filter((filename) =>
      filename.match("--only")
    ).map((filename) => new RegExp(filename.replace(/ --only/, "")));
    onlyFlagTestList.push(...hasOnlyFlagTestList);
  }
}

makeOnlyFlagTestList([
  ...Object.keys(config.tests).map((suite) => config.tests[suite]),
]);

const dir = walk(fromFileUrl(new URL(config.suitesFolder, import.meta.url)), {
  includeDirs: false,
  match: onlyFlagTestList.length ? onlyFlagTestList : testList,
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
      });

      const { code } = await process.status();
      process.close();

      assertEquals(code, 0);
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
