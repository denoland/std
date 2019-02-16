// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

async function main() {
    const p = Deno.run({
        args: ["deno", "--allow-read", "https://deno.land/x/examples/cat.ts", "README.md"],
    });

    // start subprocess
    await p.status();
}

main();