#!/usr/bin/env -S deno run --allow-read --allow-run
const p = Deno.run({
  cmd: [Deno.execPath(), "fmt", "--config", "deno.json", ...Deno.args],
});
const status = await p.status();
Deno.exit(status.code);
