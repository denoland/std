import "../global.ts";

//deno-lint-ignore no-undef
process.on("exit", () => console.log("exit"));
process.exit();
