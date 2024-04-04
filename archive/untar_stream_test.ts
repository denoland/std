import { TarStream } from "https://deno.land/std@$STD_VERSION/archive/tar_stream.ts"
import { assertEquals } from "https://deno.land/std@$STD_VERSION/assert/assert_equals.ts"
import { UnTarStream } from "https://deno.land/std@$STD_VERSION/archive/untar_stream.ts"

Deno.test('unTarStreamCheckingHeaders', async function () {
  const text = new TextEncoder().encode('Hello World!')

  const pathnames: string[] = []
  for await (
    const item of ReadableStream.from([
      {
        pathname: './potato'
      },
      {
        pathname: './text.txt',
        size: text.length,
        iterable: [text]
      }
    ])
      .pipeThrough(new TarStream())
      .pipeThrough(new UnTarStream())
  ) {
    pathnames.push(item.pathname)
    item.readable?.cancel()
  }

  assertEquals(pathnames, ['potato/', 'text.txt'])
})

Deno.test('unTarStreamValidatingBodies', async function () {
  const text = new TextEncoder().encode('Hello World!')

  for await (
    const item of ReadableStream.from([
      {
        pathname: './potato'
      },
      {
        pathname: './text.txt',
        size: text.length,
        iterable: [text]
      }
    ])
      .pipeThrough(new TarStream())
      .pipeThrough(new UnTarStream())
  ) {
    if (item.readable)
      assertEquals(await reduce(item.readable), text)
  }
})

async function reduce(readable: ReadableStream<Uint8Array>) {
  let y = new Uint8Array(0)
  for await (const x of readable) {
    const z = new Uint8Array(x.length + y.length)
    z.set(y)
    z.set(x, y.length)
    y = z
  }
  return y
}
