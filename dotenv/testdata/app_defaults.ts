import { config } from "../mod.ts";
const conf = await config();

console.log(JSON.stringify(conf, null, 2));
