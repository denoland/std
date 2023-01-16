import process from "../process.ts";

console.log(process.stdin.isTTY);
console.log(process.stdin.readableHighWaterMark);

process.stdin.setEncoding("utf8");
process.stdin.on("readable", () => {
  console.log(process.stdin.read());
});
process.stdin.on("end", () => {
  console.log("end");
});

process.stdin.push("foo");
process.nextTick(() => {
  process.stdin.push("bar");
  process.nextTick(() => {
    process.stdin.push(null);
  });
});
