// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { withoutAll } from "../../collections/without_all.ts";
import { walk } from "../../fs/walk.ts";
import { relative } from "../path/posix.ts";
import config from "./config.json" assert { type: "json" };

const encoder = new TextEncoder();

const NODE_BASE_URL = "https://github.com/nodejs/node";
const NODE_IGNORED_TEST_DIRS = [
  "addons",
  "async-hooks",
  "cctest",
  "common",
  "doctool",
  "embedding",
  "fixtures",
  "fuzzers",
  "js-native-api",
  "node-api",
  "overlapped-checker",
  "report",
  "testpy",
  "tick-processor",
  "tools",
  "v8-updates",
  "wasi",
  "wpt",
];

async function getNodeTests(): Promise<string[]> {
  const paths: string[] = [];
  const root = new URL(
    `versions/node-v${config.nodeVersion}/test`,
    import.meta.url,
  );
  const rootPath = root.href.slice(7);
  for await (const item of walk(root, { includeDirs: false, exts: [".js"] })) {
    const path = relative(rootPath, item.path);
    if (NODE_IGNORED_TEST_DIRS.every((dir) => !path.startsWith(dir))) {
      paths.push(path);
    }
  }

  return paths.sort();
}

function getDenoTests(): string[] {
  return Object.entries(config.tests)
    .filter(([testDir]) => !NODE_IGNORED_TEST_DIRS.includes(testDir))
    .flatMap(([testDir, tests]) => tests.map((test) => testDir + "/" + test));
}

async function getMissingTests(): Promise<string[]> {
  const nodeTests = await getNodeTests();

  const denoTests = await getDenoTests();

  return withoutAll(nodeTests, denoTests);
}

export async function updateToDo() {
  const file = await Deno.open(new URL("./TODO.md", import.meta.url), {
    write: true,
    create: true,
    truncate: true,
  });

  const missingTests = await getMissingTests();

  await file.write(encoder.encode("# Remaining Node Tests\n\n"));
  await file.write(
    encoder.encode(
      "NOTE: This file should not be manually edited. Please edit `config.json` and run `deno task node:setup` instead.\n\n",
    ),
  );
  await file.write(
    encoder.encode(`Total: ${missingTests.length}\n\n`),
  );

  for (const test of missingTests) {
    await file.write(
      encoder.encode(
        `- [${test}](${
          NODE_BASE_URL + `/tree/v${config.nodeVersion}/test/` + test
        })\n`,
      ),
    );
  }

  file.close();
}

if (import.meta.main) {
  await updateToDo();
}
