#!/usr/bin/env -S deno -A
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { parse } from "../flags/mod.ts";
import { glob, isGlob, walk } from "../fs/mod.ts";
import { RunOptions, runTests } from "./mod.ts";
const { args, cwd } = Deno;

const DEFAULT_GLOBS = [
  "**/*_test.ts",
  "**/*_test.js",
  "**/test.ts",
  "**/test.js"
];

function showHelp(): void {
  console.log(`Deno test runner

USAGE:
  deno -A https://deno.land/std/testing/runner.ts [OPTIONS] [MODULES...]

OPTIONS:
  -q, --quiet                 Don't show output from test cases
  -f, --failfast              Stop running tests on first error
  -e, --exclude <MODULES...>  List of comma-separated modules to exclude

ARGS:
  [MODULES...]  List of test modules to run.
                A directory <dir> will expand to:
                  ${DEFAULT_GLOBS.map((s: string): string => `<dir>/${s}`)
                    .join(`
                  `)}
                Defaults to "." when none are provided.

Note that modules can refer to file paths or URLs and globs are supported for
the former.`);
}

function filePathToRegExp(str: string): RegExp {
  if (isGlob(str)) {
    return glob(str, { flags: "g" });
  }

  return RegExp(str, "g");
}

function isRemoteUrl(url: string): boolean {
  return /^https?:\/\//.test(url);
}

function partition(
  arr: string[],
  callback: (el: string) => boolean
): [string[], string[]] {
  return arr.reduce(
    (paritioned: [string[], string[]], el: string): [string[], string[]] => {
      paritioned[callback(el) ? 1 : 0].push(el);
      return paritioned;
    },
    [[], []]
  );
}

/**
 * Given list of globs or URLs to include and exclude and root directory return
 * list of file URLs that should be imported for test runner.
 */
export async function getMatchingUrls(
  matchPaths: string[],
  excludePaths: string[],
  root: string
): Promise<string[]> {
  const [includeLocal, includeRemote] = partition(matchPaths, isRemoteUrl);
  const [excludeLocal, excludeRemote] = partition(excludePaths, isRemoteUrl);

  const localFileIterator = walk(root, {
    match: includeLocal.map((f: string): RegExp => filePathToRegExp(f)),
    skip: excludeLocal.map((f: string): RegExp => filePathToRegExp(f))
  });

  let matchingLocalUrls: string[] = [];
  for await (const { filename } of localFileIterator) {
    matchingLocalUrls.push(`file://${filename}`);
  }

  const excludeRemotePatterns = excludeRemote.map(
    (url: string): RegExp => RegExp(url)
  );
  const matchingRemoteUrls = includeRemote.filter(
    (candidateUrl: string): boolean => {
      return !excludeRemotePatterns.some((pattern: RegExp): boolean => {
        const r = pattern.test(candidateUrl);
        pattern.lastIndex = 0;
        return r;
      });
    }
  );

  return matchingLocalUrls.concat(matchingRemoteUrls);
}

export interface RunTestModulesOptions extends RunOptions {
  exclude?: string[];
}

/**
 * Import the specified test modules and run their tests as a suite.
 *
 * Test modules are specified as an array of strings and can include local files
 * or URLs.
 *
 * File matching and excluding support glob syntax - arguments recognized as
 * globs will be expanded using `glob()` from the `fs` module.
 *
 * Example:
 *
 *       runTestModules(["**\/*_test.ts", "**\/test.ts"]);
 *
 * Any matched directory `<dir>` will expand to:
 *   - `<dir>/**\/*_test.ts`
 *   - `<dir>/**\/*_test.js`
 *   - `<dir>/**\/test.ts`
 *   - `<dir>/**\/test.js`
 *
 * So the above example is captured naturally by:
 *
 *       runTestModules(["."]);
 */
// TODO: Change return type to `Promise<void>` once, `runTests` is updated
// to return boolean instead of exiting.
export async function runTestModules(
  include: string[],
  {
    exclude = [],
    parallel = false,
    exitOnFail = false,
    only = /[^\s]/,
    skip = /^\s*$/,
    disableLog = false
  }: RunTestModulesOptions = {}
): Promise<void> {
  // TODO: Remove the concept of a root, support parent paths.
  const root = cwd();
  const testModuleUrls = await getMatchingUrls(include, exclude, root);

  if (testModuleUrls.length == 0) {
    console.error("No matching test files found.");
    return;
  }

  console.log(`Found ${testModuleUrls.length} matching test files.`);

  for (const url of testModuleUrls) {
    await import(url);
  }

  await runTests({
    parallel,
    exitOnFail,
    only,
    skip,
    disableLog
  });
}

async function main(): Promise<void> {
  const parsedArgs = parse(args.slice(1), {
    boolean: ["failfast", "help", "quiet"],
    string: ["exclude"],
    alias: {
      exclude: ["e"],
      failfast: ["f"],
      help: ["h"],
      quiet: ["q"]
    },
    default: {
      failfast: false,
      help: false,
      quiet: false
    }
  });

  if (parsedArgs.help) {
    return showHelp();
  }

  const include =
    parsedArgs._.length > 0
      ? (parsedArgs._ as string[]).flatMap((fileGlob: string): string[] => {
          return fileGlob.split(",");
        })
      : DEFAULT_GLOBS;

  const exclude =
    parsedArgs.exclude != null ? (parsedArgs.exclude as string).split(",") : [];

  await runTestModules(include, {
    exclude,
    exitOnFail: parsedArgs.failfast,
    disableLog: parsedArgs.quiet
  });
}

if (import.meta.main) {
  main();
}
