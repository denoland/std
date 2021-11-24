import "../global.ts";

self.addEventListener("unload", () => {
  console.error("unload 1");

  queueMicrotask(() => {
    console.error("unload microtask");
  });
});

self.addEventListener("unload", () => {
  console.error("unload 2");
});

function onError(error: Error) {
  process.exitCode = 2;

  console.error(`Something went wrong! ${error.message}`);
}

// deno-lint-ignore require-await
(async function main() {
  throw new Error("boom!");
}()).catch(onError);
