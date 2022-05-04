import "../load.ts";
import "./load_child_env.ts";

console.log(Deno.env.get("GREETING"));
