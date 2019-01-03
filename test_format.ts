#!/usr/bin/env deno --allow-run
// This program fails if format.ts changes any files.
import { run, exit } from "deno";

async function main() {
  const p = run({
    args: ["deno", "format.ts"]
  });
  await p.status();
  p.close();

  const git = run({
    args: ["git", "status", "-uno", "--porcelain"],
    stdout: "piped"
  });

  const output = await git.output();
  git.close();

  if (output.length) {
    const outputText = new TextDecoder().decode(output);
    console.log("Run format.ts");
    console.log(outputText);
    exit(1);
  }
}

main();
