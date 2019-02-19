// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

async function main() {
  const p = Deno.run({
    args: ["deno", "https://deno.land/welcome.ts"]
  });

  // start subprocess
  await p.status();
}

main();
