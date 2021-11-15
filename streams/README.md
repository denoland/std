# std/streams

## Conversion

### readerFromStreamReader

Creates a `Reader` from a `ReadableStreamDefaultReader`.

```ts
import {
  copy,
  readerFromStreamReader,
} from "https://deno.land/std@$STD_VERSION/streams/mod.ts";
const res = await fetch("https://deno.land");
const file = await Deno.open("./deno.land.html", { create: true, write: true });

const reader = readerFromStreamReader(res.body!.getReader());
await copy(reader, file);
file.close();
```

### writerFromStreamWriter

Creates a `Writer` from a `WritableStreamDefaultWriter`.

```ts
import {
  copy,
  writerFromStreamWriter,
} from "https://deno.land/std@$STD_VERSION/streams/mod.ts";
const file = await Deno.open("./deno.land.html", { read: true });

const writableStream = new WritableStream({
  write(chunk): void {
    console.log(chunk);
  },
});
const writer = writerFromStreamWriter(writableStream.getWriter());
await copy(file, writer);
file.close();
```
