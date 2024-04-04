import { TarStream } from "https://deno.land/std@$STD_VERSION/archive/tar_stream.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/assert/assert_equals.ts";

Deno.test("createTarArchiveViaStream", async function () {
  const text = new TextEncoder().encode("Hello World!");

  const size = (await reduce(
    ReadableStream.from([
      {
        pathname: "./potato",
      },
      {
        pathname: "./text.txt",
        size: text.length,
        iterable: [text],
      },
    ])
      .pipeThrough(new TarStream()),
  )).length;

  assertEquals(size, 512 + 512 + Math.ceil(text.length / 512) * 512 + 1024);
});

async function reduce(readable: ReadableStream<Uint8Array>) {
  let y = new Uint8Array(0);
  for await (const x of readable) {
    const z = new Uint8Array(x.length + y.length);
    z.set(y);
    z.set(x, y.length);
    y = z;
  }
  return y;
}
