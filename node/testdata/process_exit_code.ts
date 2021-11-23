import "../global.ts";

function onError(error: Error) {
  process.exitCode = 2;

  console.error(`Something went wrong! ${error.message}`);
}

// deno-lint-ignore require-await
(async function main() {
  throw new Error("boom!");
}()).catch(onError);
