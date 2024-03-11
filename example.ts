import { parseArgs } from "https://deno.land/std@$STD_VERSION/cli/parse_args.ts";

const parsedArgs = parseArgs(Deno.args);
console.log(parsedArgs);
