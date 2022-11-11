// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import {
  createGraph,
  Module,
} from "https://deno.land/x/deno_graph@0.37.1/mod.ts";
import { walk } from "../fs/walk.ts";

const ROOT = new URL("../", import.meta.url);
const EXTS = [".mjs", ".ts"];
const SKIP = [
  /** Test code as defined in https://deno.land/manual/basics/testing#running-tests */
  /(?:[^/]*_|[^/]*\.|)?.test\.(?:ts| tsx| mts| js| mjs| jsx| cjs| cts)\/*/,
  /** Ignored test code as defined in Deno configuration file */
  /node\//,
  /** Benchmark code as defined in https://deno.land/manual@v1.25.2/tools/benchmarker#running-benchmarks */
  /(?:[^/]*_|[^/]*\.|)?.bench\.(?:ts| tsx| mts| js| mjs| jsx| cjs| cts)\/*/,
  /** Other test code */
  /testdata/,
];
const BAD_IMPORT = new URL("../testing/asserts.ts", import.meta.url);
const EXCEPTION = new URL("../node/assert.ts", import.meta.url);

async function getFilePaths(): Promise<string[]> {
  const paths: string[] = [];
  for await (const { path } of walk(ROOT, { exts: EXTS, skip: SKIP })) {
    paths.push("file://" + path);
  }
  return paths;
}

function hasBadImports({ dependencies }: Module): boolean {
  return Object.values(dependencies!)
    .some(({ code }) => code?.specifier?.includes(BAD_IMPORT.href));
}

async function getFilePathsWithBadImports(): Promise<string[]> {
  const paths = await getFilePaths();
  const { modules } = await createGraph(paths);
  return modules.filter(hasBadImports)
    .map(({ specifier }: Module) => specifier)
    .filter((path) => path !== EXCEPTION.href);
}

const paths = await getFilePathsWithBadImports();
if (paths.length > 0) {
  console.error(
    "Non-test code must use `_util/assert.ts` for assertions. Please fix:",
  );
  paths.forEach((path) => console.error("- " + path));
  Deno.exit(1);
}
