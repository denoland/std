#!/usr/bin/env -S deno run --no-check=remote --allow-read=. --allow-write=.
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { Foras, gunzip } from "https://deno.land/x/denoflate@2.0.2/deno/mod.ts";
import { Untar } from "../../archive/untar.ts";
import { walk } from "../../fs/walk.ts";
import {
  basename,
  dirname,
  fromFileUrl,
  join,
  resolve,
  sep,
} from "../../path/mod.ts";
import { ensureFile } from "../../fs/ensure_file.ts";
import { config, ignoreList } from "./common.ts";
import { Buffer } from "../../io/buffer.ts";
import { copy } from "../../streams/copy.ts";
import { readAll } from "../../streams/read_all.ts";
import { writeAll } from "../../streams/write_all.ts";
import { downloadFile } from "../../_util/download_file.ts";
import { updateToDo } from "./list_remaining_tests.ts";

Foras.initSyncBundledOnce();

/**
 * This script will download and extract the test files specified in the
 * configuration file
 *
 * It will delete any previous tests unless they are specified on the `ignore`
 * section of the configuration file
 *
 * Usage: `deno run --allow-read --allow-net --allow-write setup.ts`
 *
 * You can additionally pass a flag to indicate if cache should be used for generating
 * the tests, or to generate the tests from scratch (-y/-n)
 */

Foras.initSyncBundledOnce();

const USE_CACHE = Deno.args.includes("-y");
const DONT_USE_CACHE = Deno.args.includes("-n");

if (USE_CACHE && DONT_USE_CACHE) {
  throw new Error(
    '"-y" and "-n" options for cache can\'t be used at the same time',
  );
}

let CACHE_MODE: "cache" | "prompt" | "no_cache";
if (USE_CACHE) {
  CACHE_MODE = "cache";
} else if (DONT_USE_CACHE) {
  CACHE_MODE = "no_cache";
} else {
  CACHE_MODE = "prompt";
}

const NODE_URL = "https://nodejs.org/dist/v" + config.nodeVersion;
const NODE_FILE = "node-v" + config.nodeVersion;
const NODE_ARCHIVE_FILE = `${NODE_FILE}.tar.gz`;
const NATIVE_NODE_TESTS_FOLDER = "/test";

/** URL for the download */
const url = `${NODE_URL}/${NODE_ARCHIVE_FILE}`;
/** Local archive's url location */
const archivePath = join(config.versionsFolder, NODE_ARCHIVE_FILE);
/** Local decompressed source's location */
const decompressedSourcePath = join(config.versionsFolder, NODE_FILE);

function checkConfigTestFilesOrder(testFileLists: Array<string[]>) {
  for (const testFileList of testFileLists) {
    const sortedTestList = JSON.parse(JSON.stringify(testFileList));
    sortedTestList.sort();
    if (JSON.stringify(testFileList) !== JSON.stringify(sortedTestList)) {
      throw new Error(`File names in \`config.json\` are not correct order.`);
    }
  }
}

checkConfigTestFilesOrder([
  ...Object.keys(config.ignore).map((suite) => config.ignore[suite]),
  ...Object.keys(config.tests).map((suite) => config.tests[suite]),
]);

async function clearTests() {
  console.log("Cleaning up previous tests");

  const files = walk(
    fromFileUrl(new URL(config.suitesFolder, import.meta.url)),
    {
      includeDirs: false,
      skip: ignoreList,
    },
  );

  for await (const file of files) {
    await Deno.remove(file.path);
  }
}

async function decompressTests(archivePath: string) {
  console.log(`Decompressing ${basename(archivePath)}...`);

  const compressedFile = await Deno.open(
    new URL(archivePath, import.meta.url),
    { read: true },
  );

  const buffer = new Buffer(gunzip(await readAll(compressedFile)));
  compressedFile.close();

  const tar = new Untar(buffer);
  const outFolder = dirname(fromFileUrl(new URL(archivePath, import.meta.url)));
  const testsFolder = `${NODE_FILE}${NATIVE_NODE_TESTS_FOLDER}`;

  for await (const entry of tar) {
    if (entry.type !== "file") continue;
    if (!entry.fileName.startsWith(testsFolder)) continue;
    const path = join(outFolder, entry.fileName);
    await ensureFile(path);
    const file = await Deno.open(path, {
      create: true,
      truncate: true,
      write: true,
    });
    await copy(entry, file);
    file.close();
  }
}

/**
 * This will iterate over test list defined in the configuration file and test the
 * passed file against it. If a match were to be found, it will return the test
 * suite specified for that file
 */
function getRequestedFileSuite(
  file: string,
  expectedSuite: string,
): string | undefined {
  if (!Array.isArray(config.tests[expectedSuite])) {
    return;
  }

  for (const regex of config.tests[expectedSuite]) {
    if (new RegExp("^" + regex).test(file)) {
      return expectedSuite;
    }
  }
}

async function copyTests(filePath: string) {
  console.log("Copying test files...");
  const path = join(
    fromFileUrl(new URL(filePath, import.meta.url)),
    NATIVE_NODE_TESTS_FOLDER,
  );
  const suitesFolder = fromFileUrl(
    new URL(config.suitesFolder, import.meta.url),
  );

  for await (const entry of walk(path, { skip: ignoreList })) {
    const fragments = entry.path.split(sep);
    // Note: When the path is, for example,
    // "/path/to/deno_std/node/_tools/versions/node-v18.12.1/test/fixtures/policy/main.mjs"
    // then expectedSuite becomes "fixtures/policy" (The folder after "test" becomes "suite")
    const expectedSuite = fragments.slice(fragments.indexOf(NODE_FILE) + 2, -1)
      .join("/");
    const suite = getRequestedFileSuite(entry.name, expectedSuite);
    if (!suite) continue;

    const destPath = resolve(suitesFolder, suite, basename(entry.name));
    await ensureFile(destPath);
    const destFile = await Deno.open(destPath, {
      create: true,
      truncate: true,
      write: true,
    });
    const srcFile = await Deno.open(join(path, suite, entry.name), {
      read: true,
    });
    // This will allow CI to pass without checking linting and formatting
    // on the test suite files, removing the need to maintain that as well
    await writeAll(
      destFile,
      new TextEncoder().encode(
        "// deno-fmt-ignore-file\n// deno-lint-ignore-file\n" +
          "\n// Copyright Joyent and Node contributors. All rights reserved. MIT license.\n" +
          `// Taken from Node ${config.nodeVersion}\n` +
          '// This file is automatically generated by "node/_tools/setup.ts". Do not modify this file manually\n\n',
      ),
    );
    await copy(srcFile, destFile);
    srcFile.close();
    destFile.close();
  }
}

// main
let shouldDownload = false;
if (CACHE_MODE === "prompt") {
  let testArchiveExists = false;

  try {
    Deno.lstatSync(new URL(archivePath, import.meta.url));
    testArchiveExists = true;
  } catch (e) {
    if (!(e instanceof Deno.errors.NotFound)) {
      throw e;
    }
    shouldDownload = true;
  }

  if (testArchiveExists) {
    while (true) {
      const r = (prompt(`File "${archivePath}" found, use file? Y/N:`) ?? "")
        .trim()
        .toUpperCase();
      if (r === "Y") {
        break;
      } else if (r === "N") {
        shouldDownload = true;
        break;
      } else {
        console.log(`Unexpected: "${r}"`);
      }
    }
  }
} else if (CACHE_MODE === "no_cache") {
  shouldDownload = true;
}

if (shouldDownload) {
  console.log(`Downloading ${url} in path "${archivePath}" ...`);
  await downloadFile(url, new URL(archivePath, import.meta.url));
  console.log(`Downloaded: ${url} into ${archivePath}`);
}

let shouldDecompress = false;
if (CACHE_MODE === "prompt") {
  let testFolderExists = false;
  try {
    Deno.lstatSync(new URL(decompressedSourcePath, import.meta.url));
    testFolderExists = true;
  } catch (e) {
    if (!(e instanceof Deno.errors.NotFound)) {
      throw e;
    }
    shouldDecompress = true;
  }

  if (testFolderExists) {
    while (true) {
      const r = (
        prompt(
          `Decompressed file "${decompressedSourcePath}" found, use file? Y/N:`,
        ) ?? ""
      )
        .trim()
        .toUpperCase();
      if (r === "Y") {
        break;
      } else if (r === "N") {
        shouldDecompress = true;
        break;
      } else {
        console.log(`Unexpected: "${r}"`);
      }
    }
  }
} else if (CACHE_MODE === "no_cache") {
  shouldDecompress = true;
}

if (shouldDecompress) {
  await decompressTests(archivePath);
}

await clearTests();
await copyTests(decompressedSourcePath);
await updateToDo();
