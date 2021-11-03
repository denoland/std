#!/usr/bin/env -S deno run --allow-read --allow-run
const p = Deno.run({
  cmd: [Deno.execPath(), "fmt", "--config", "deno.json", ...Deno.args],
});
Deno.exit(await p.status());
