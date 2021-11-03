#!/usr/bin/env -S deno run --allow-read --allow-run
const p = Deno.run({
  cmd: [
    Deno.execPath(),
    "test",
    "--doc",
    "--unstable",
    "--allow-all",
    "--import-map=test_import_map.json",
    "--config=strict-ts44.tsconfig.json",
    "--ignore=.git,node/_tools/versions/",
    ...Deno.args,
  ],
});
Deno.exit(await p.status());
