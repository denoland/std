#!/usr/bin/env deno --allow-run --allow-write
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import "./prettier/prettier.js";
import "./prettier/parser_typescript.js";
import "./prettier/parser_markdown.js";
import { args, platform, readAll, exit, run, readFile, writeFile } from "deno";
import { parse } from "./flags/mod.ts";

// TODO: provide decent type declarions for these
const { prettier, prettierPlugins } = window as any;

// Runs commands in cross-platform way
function xrun(opts) {
  return run({
    ...opts,
    args: platform.os === "win" ? ["cmd.exe", "/c", ...opts.args] : opts.args
  });
}

// Gets the source files in the repository
async function getSourceFiles() {
  return new TextDecoder()
    .decode(
      await readAll(
        xrun({
          args: ["git", "ls-files"],
          stdout: "piped"
        }).stdout
      )
    )
    .trim()
    .split(/\r?\n/);
}

/**
 * Checks if the file has been formatted with prettier.
 */
async function checkFile(
  filename: string,
  parser: "typescript" | "markdown"
): Promise<boolean> {
  const text = new TextDecoder().decode(await readFile(filename));
  const formatted = prettier.check(text, {
    parser,
    plugins: prettierPlugins
  });

  if (!formatted) {
    console.log(`${filename} ... Not formatted`);
  }

  return formatted;
}

/**
 * Formats the given file.
 */
async function formatFile(
  filename: string,
  parser: "typescript" | "markdown"
): Promise<void> {
  const text = new TextDecoder().decode(await readFile(filename));
  const formatted = prettier.format(text, {
    parser,
    plugins: prettierPlugins
  });

  if (text !== formatted) {
    console.log(`Formatting ${filename}`);
    await writeFile(filename, new TextEncoder().encode(formatted));
  }
}

/**
 * Checks if the all files have been formatted with prettier.
 */
async function checkSourceFiles() {
  const checks = [];

  (await getSourceFiles()).forEach(file => {
    if (/\.ts$/.test(file)) {
      checks.push(checkFile(file, "typescript"));
    } else if (/\.md$/.test(file)) {
      checks.push(checkFile(file, "markdown"));
    }
  });

  const results = await Promise.all(checks);

  if (results.every(result => result)) {
    exit(0);
  } else {
    exit(1);
  }
}

/**
 * Formats the all files with prettier.
 */
async function formatSourceFiles() {
  const formats = [];

  (await getSourceFiles()).forEach(file => {
    if (/\.ts$/.test(file)) {
      formats.push(formatFile(file, "typescript"));
    } else if (/\.md$/.test(file)) {
      formats.push(formatFile(file, "markdown"));
    }
  });

  await Promise.all(formats);
  exit(0);
}

async function main(opts) {
  try {
    if (opts.check) {
      await checkSourceFiles();
    } else {
      await formatSourceFiles();
    }
  } catch (e) {
    console.log(e);
    exit(1);
  }
}

main(parse(args));
