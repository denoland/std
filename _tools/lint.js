#!/usr/bin/env -S deno run --allow-read --allow-run
const p = Deno.run({ cmd: [Deno.execPath(), "lint", "--config", "deno.json"] });
Deno.exit(await p.status());
