import "../global.ts";

let intervalId: number;

const handler = async () => {
  console.log("got signal");
  await new Promise((resolve) => {
    setTimeout(resolve, 1000)
  });
  clearInterval(intervalId);
};
//deno-lint-ignore no-undef
process.on("SIGINT", handler);
intervalId = setInterval(() => {}, 1000);
