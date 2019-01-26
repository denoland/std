#!/usr/bin/env deno --allow-run --allow-write
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import "./prettier/prettier.js";
import "./prettier/parser-typescript.js";
import "./prettier/parser-markdown.js";
import { platform, readAll, exit, run, readFile, writeFile } from "deno";

// TODO: provide decent type declarions for these
const { prettier, prettierPlugins } = window as any;

// Runs commands in cross-platform way
function xrun(opts) {
  return run({
    ...opts,
    args: platform.os === "win" ? ["cmd.exe", "/c", ...opts.args] : opts.args
  });
}

const decoder = new TextDecoder();
const encoder = new TextEncoder();

function decode(data) {
  return decoder.decode(data);
}

function encode(str) {
  return encoder.encode(str);
}

// Gets the source files in the repository
async function getSourceFiles() {
  return decode(
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

async function formatFile(filename, parser: "typescript" | "markdown") {
  const text = decode(await readFile(filename));
  const formatted = prettier.format(text, {
    parser,
    plugins: prettierPlugins
  });

  if (text !== formatted) {
    await writeFile(filename, encode(formatted));
  }
}

async function main() {
  const formats = [];

  (await getSourceFiles()).forEach(file => {
    if (/\.ts$/.test(file)) {
      formats.push(formatFile(file, "typescript"));
    } else if (/\.md$/.test(file)) {
      formats.push(formatFile(file, "markdown"));
    }
  });

  try {
    await Promise.all(formats);
    exit(0);
  } catch (e) {
    console.log(e);
    exit(1);
  }
}

main();
