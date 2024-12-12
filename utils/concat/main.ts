#!/usr/bin/env -S deno run --allow-read --allow-write
import { expandGlob } from "@std/fs";
import type { Writer } from "@std/io";
import { relative, globToRegExp } from "@std/path";
import { encode } from "gpt-tokenizer/model/o1-preview";
import humanize from "humanize-number";
import denoData from "./deno.json" with { type: "json" };

const printHelp = async (): Promise<void> => {
  console.log(`concat v${denoData.version}

Usage:
  concat [options] [glob ...]

Options:
  --help          Show this help message and exit.
  --output FILE   Write output to FILE (default: concat.txt if not using --stdout).
  --stdout        Write output to stdout only, no info messages.
  --ignore GLOB   Add a glob to ignore. Can be used multiple times.

If no arguments are provided, it's equivalent to "." which is equivalent to "**/*".
This means all files are included by default, except those ignored.

By default, these are ignored:
  .lock, .git, .git/**, .gitignore, LICENSE, concat.txt

Additional ignores can be specified via --ignore.
`);
};

const compareSemver = (a: string, b: string): number => {
  const pa = a.replace(/^v/, "").split(".").map(Number);
  const pb = b.replace(/^v/, "").split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff < 0 ? -1 : 1;
  }
  return 0;
};

export const main = async (args = [...Deno.args])  => {
  if (args.includes("--help")) {
    await printHelp();
    Deno.exit(0);
  }

  let outputFile: string | undefined;
  let toStdout = false;
  const ignoreGlobs: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--output") {
      if (i + 1 >= args.length) {
        console.error("Error: --output specified but no file provided.");
        Deno.exit(1);
      }
      outputFile = args[i + 1];
      args.splice(i, 2);
      i--;
    } else if (a === "--stdout") {
      toStdout = true;
      args.splice(i, 1);
      i--;
    } else if (a === "--ignore") {
      if (i + 1 >= args.length) {
        console.error("Error: --ignore specified but no glob provided.");
        Deno.exit(1);
      }
      ignoreGlobs.push(args[i + 1]);
      args.splice(i, 2);
      i -= 2;
    }
  }

  let patterns: string[] = [];
  if (args.length === 0) {
    patterns = ["**/*"];
  } else if (args.length === 1 && args[0] === ".") {
    patterns = ["**/*"];
  } else {
    patterns = args;
  }

  if (!outputFile && !toStdout) {
    outputFile = "concat.txt";
  }

  const defaultIgnores = [
    "*.lock",
    ".git",
    ".git/**",
    ".gitignore",
    "LICENSE",
    "concat.txt",
  ];
  const allIgnoredGlobs = [...defaultIgnores, ...ignoreGlobs].map(g => globToRegExp(g, { globstar: true }));

  let fileExistedBefore = false;
  if (outputFile && !toStdout) {
    try {
      await Deno.stat(outputFile);
      fileExistedBefore = true;
    } catch {
      fileExistedBefore = false;
    }
  }

  let out: Writer & { close?: () => void };
  if (toStdout) {
    out = Deno.stdout;
  } else {
    out = await Deno.open(outputFile as string, { write: true, create: true, truncate: true });
  }

  const enc = new TextEncoder();
  const processedFiles: string[] = [];

  for (const pattern of patterns) {
    for await (const file of expandGlob(pattern, { globstar: true })) {
      if (!file.isFile) continue;
      const rel = relative(Deno.cwd(), file.path);
      const ignored = allIgnoredGlobs.some((re) => re.test(rel));
      if (ignored) continue;
      const data = await Deno.readTextFile(file.path);
      processedFiles.push(rel);
      await out.write(enc.encode(`-----BEGIN FILE ${rel}-----\n${data}\n-----END FILE ${rel}-----\n`));
    }
  }

  if (out.close) out.close();

  if (toStdout) return;

  console.log("Processed files:");
  for (const f of processedFiles) {
    console.log(`- ${f}`);
  }
  console.log(`Total files processed: ${processedFiles.length}`);

  if (outputFile) {
    const outputText = await Deno.readTextFile(outputFile);
    const tokens = await encode(outputText);
    const formattedTokenCount = humanize(tokens.length);
    const fileStatus = fileExistedBefore ? "updated" : "created";
    console.log(`✅ Operation complete! ${fileStatus} ${outputFile} with ${formattedTokenCount} o1 tokens. 🎉`);
  }

  // Check for newer version
  const currentVersion = `v${denoData.version}`;
  try {
    const metaRes = await fetch("https://jsr.io/@dreamcatcher/concat/meta.json", {
      headers: { "Accept": "application/json" },
    });
    if (metaRes.ok) {
      const meta = await metaRes.json();
      const availableVersions = Object.keys(meta.versions).filter((v) => !meta.versions[v].yanked);
      const latest = availableVersions.sort((a, b) => compareSemver(a, b))[availableVersions.length - 1];
      if (compareSemver(latest, currentVersion) > 0) {
        console.log(`
A newer version (${latest}) is available. Run the following to upgrade:

deno install --global --reload --force --allow-read --allow-write --allow-net=jsr.io jsr:@dreamcatcher/concat@${latest}
`);
      }
    }
  } catch {
    // ignore errors
  }
};

if (import.meta.main) {
  main();
}
