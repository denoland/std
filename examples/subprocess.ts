// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

const fileNames = Deno.args.slice(1);
const decoder = new TextDecoder();

const p = Deno.run({
  args: [
    "deno",
    "--allow-read",
    "https://deno.land/x/examples/cat.ts",
    ...fileNames
  ],
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
