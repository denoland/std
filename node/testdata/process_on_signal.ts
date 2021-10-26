import "../global.ts";

let intervalId: number;

const handler = () => {
  console.log("got signal");
  clearInterval(intervalId);
};
//deno-lint-ignore no-undef
process.on("SIGINT", handler);
intervalId = setInterval(() => {}, 1000);
