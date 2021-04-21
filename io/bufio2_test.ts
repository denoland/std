import { readLines } from "./bufio.ts";
Deno.test("readLines big file", async () => {
  const file = await Deno.open("bigfile");
  const now = Date.now();
  let count = 0;
  for await (const line of readLines(file)) {
    count++;
  }
  console.log((Date.now() - now) / 1000, count);
  file.close();
})
