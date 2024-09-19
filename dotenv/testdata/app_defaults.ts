import { load } from "../mod.ts";
const conf = await load();

// deno-lint-ignore no-console
console.log(JSON.stringify(conf, null, 2));
