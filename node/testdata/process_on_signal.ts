import "../global.ts";

const handler = () => {
  console.log("got signal");
};
//deno-lint-ignore no-undef
process.on("SIGINT", handler);
