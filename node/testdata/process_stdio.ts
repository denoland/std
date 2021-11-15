import "../global.ts";
import { Buffer } from "../buffer.ts";
import { Readable } from "../stream.ts";

function makeContents(): Readable {
  const stream = new Readable({ read() {} });
  stream.push("hello");
  stream.push("world");
  stream.push("from pipe");
  stream.push(null);
  return stream;
}

makeContents().pipe(process.stdout);
makeContents().pipe(process.stderr);

process.stdout.write("received:");
process.stdout.write(process.stdin.read()?.toString());

process.stdin.pipe(process.stdout);

process.stderr.write("hello");
process.stderr.write(Buffer.from("world").toString("base64"), "base64");

process.stdout.write("hello");
process.stdout.write(Buffer.from("world").toString("base64"), "base64");

process.stdin.destroy();
try {
  // this should throw if stdout is closed
  await Deno.stdin.read(new Uint8Array(1));
  Deno.stdout.write(new Uint8Array([1]));
  // deno-lint-ignore no-empty
} catch {}

process.stdout.destroy();
// this should throw if stdout is closed
Deno.stdout.write(new Uint8Array([1])).catch(() => {});

process.stderr.destroy();
// this should throw if stdout is closed
Deno.stderr.write(new Uint8Array([1])).catch(() => {});

Deno.exit(0);
