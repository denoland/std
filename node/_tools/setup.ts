import { gunzip } from "https://deno.land/x/compress@v0.3.6/gzip/gzip.ts";
import { Untar } from "../../archive/tar.ts";
import { walk } from "../../fs/walk.ts";
import {
  basename,
  dirname,
  fromFileUrl,
  join,
  resolve,
} from "../../path/mod.ts";
import { ensureFile } from "../../fs/ensure_file.ts";
import { config, ignoreList } from "./common.ts";
import { Buffer } from "../../io/buffer.ts";
import { readAll, writeAll } from "../../io/util.ts";

/**
 * This script will download and extract the test files specified in the
 * configuration file
 *
 * It will delete any previous tests unless they are specified on the `ignore`
 * section of the configuration file
 *
 * Usage: `deno run --allow-read --allow-net --allow-write setup.ts`
 */

const NODE_URL = "https://nodejs.org/dist/vNODE_VERSION";
const NODE_FILE = "node-vNODE_VERSION";
const NODE_ARCHIVE_FILE = `${NODE_FILE}.tar.gz`;
const NATIVE_NODE_TESTS_FOLDER = "/test";

/** URL for the download */
const url = `${NODE_URL}/${NODE_ARCHIVE_FILE}`.replaceAll(
  "NODE_VERSION",
  config.nodeVersion,
);
/** Local archive's url location */
const archivePath = join(
  config.versionsFolder,
  NODE_ARCHIVE_FILE.replaceAll("NODE_VERSION", config.nodeVersion),
);
/** Local decompressed source's location */
const decompressedSourcePath = join(
  config.versionsFolder,
  NODE_FILE.replaceAll("NODE_VERSION", config.nodeVersion),
);

/**
 * This will overwrite the file if found
 * */
async function downloadFile(url: string, path: string) {
  console.log(`Downloading: ${url}...`);
  const fileContent = await fetch(url)
    .then((response) => {
      if (response.ok) {
        if (!response.body) {
          throw new Error(
            `The requested download url ${url} doesn't contain an archive to download`,
          );
        }
        return response.body.getIterator();
      } else if (response.status === 404) {
        throw new Error(
          `The requested version ${config.nodeVersion} could not be found for download`,
        );
      }
      throw new Error(`Request failed with status ${response.status}`);
    });

  const filePath = fromFileUrl(new URL(path, import.meta.url));

  await ensureFile(filePath);
  const file = await Deno.open(filePath, {
    truncate: true,
    write: true,
  });
  for await (const chunk of fileContent) {
    await Deno.write(file.rid, chunk);
  }
  file.close();
  console.log(`Downloaded: ${url} into ${path}`);
}

async function clearTests() {
  console.log("Cleaning up previous tests");

  const files = walk(
    (fromFileUrl(new URL(config.suitesFolder, import.meta.url))),
    {
      includeDirs: false,
      skip: ignoreList,
    },
  );

  for await (const file of files) {
    await Deno.remove(file.path);
  }
}

/**
 * This will iterate over test list defined in the configuration file and test the
 * passed file against it. If a match were to be found, it will return the test
 * suite specified for that file
 */
function getRequestedFileSuite(file: string): string | undefined {
  for (const suite in config.tests) {
    for (const regex of config.tests[suite]) {
      if (new RegExp(regex).test(file)) {
        return suite;
      }
    }
  }
}

async function decompressTests(archivePath: string) {
  console.log(`Decompressing ${basename(archivePath)}...`);

  const compressedFile = await Deno.open(
    new URL(archivePath, import.meta.url),
    { read: true },
  );

  const buffer = new Buffer(gunzip(await readAll(compressedFile)));
  Deno.close(compressedFile.rid);

  const tar = new Untar(buffer);
  const outFolder = dirname(fromFileUrl(new URL(archivePath, import.meta.url)));
  const testsFolder = `${NODE_FILE}${NATIVE_NODE_TESTS_FOLDER}`.replace(
    "NODE_VERSION",
    config.nodeVersion,
  );

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
    await Deno.copy(entry, file);
    file.close();
  }
}

async function copyTests(filePath: string): Promise<void> {
  console.log("Copying test files...");
  const path = join(
    fromFileUrl(new URL(filePath, import.meta.url)),
    NATIVE_NODE_TESTS_FOLDER,
  );
  const suitesFolder = fromFileUrl(
    new URL(config.suitesFolder, import.meta.url),
  );
  for await (const entry of walk(path, { skip: ignoreList })) {
    const suite = getRequestedFileSuite(entry.name);
    if (!suite) continue;

    const destPath = resolve(
      suitesFolder,
      suite,
      basename(entry.name),
    );
    await ensureFile(destPath);
    const destFile = await Deno.open(destPath, {
      create: true,
      truncate: true,
      write: true,
    });
    const srcFile = await Deno.open(
      join(path, suite, entry.name),
      { read: true },
    );
    // This will allow CI to pass without checking linting and formatting
    // on the test suite files, removing the need to mantain that as well
    await writeAll(
      destFile,
      new TextEncoder().encode(
        "// deno-fmt-ignore-file\n// deno-lint-ignore-file\n" +
          "\n// Copyright Joyent and Node contributors. All rights reserved. MIT license.\n" +
          `// Taken from Node ${config.nodeVersion}\n` +
          '// This file is automatically generated by "node/_tools/setup.ts". Do not modify this file manually\n\n',
      ),
    );
    await Deno.copy(srcFile, destFile);
    srcFile.close();
    destFile.close();
  }
}

let shouldDownload = false;
try {
  Deno.lstatSync(new URL(archivePath, import.meta.url));
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
} catch (e) {
  if (!(e instanceof Deno.errors.NotFound)) {
    throw e;
  }
  shouldDownload = true;
}

if (shouldDownload) {
  console.log(`Downloading ${url} in path "${archivePath}" ...`);
  await downloadFile(url, archivePath);
}

let shouldDecompress = false;
try {
  const p = new URL(decompressedSourcePath, import.meta.url);
  Deno.lstatSync(p);
  while (true) {
    const r = (prompt(
      `Decompressed file "${decompressedSourcePath}" found, use file? Y/N:`,
    ) ?? "").trim()
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
} catch (e) {
  if (!(e instanceof Deno.errors.NotFound)) {
    throw e;
  }
  shouldDecompress = true;
}

if (shouldDecompress) {
  await decompressTests(archivePath);
}

await clearTests();
await copyTests(decompressedSourcePath);
