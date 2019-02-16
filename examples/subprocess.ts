// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

async function main() {
  const decoder = new TextDecoder();
  const filesToCat = Deno.args.slice(1);
  const args = [
    "deno",
    "--allow-read",
    "https://deno.land/x/examples/cat.ts",
    ...filesToCat
  ];

  const p = Deno.run({
    args,
    stdout: "piped",
    stderr: "piped"
  });

  const { code } = await p.status();

  if (code === 0) {
    const rawOutput = await Deno.readAll(p.stdout);
    const output = decoder.decode(rawOutput);
    console.log(output);
  } else {
    const rawErr = await Deno.readAll(p.stderr);
    const err = decoder.decode(rawErr);
    console.log(err);
  }

  Deno.exit(code);
}

main();
