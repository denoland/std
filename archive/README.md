# Usage

## Tar

```ts
import { Tar } from "https://deno.land/std@$STD_VERSION/archive/tar.ts";
import { Buffer } from "https://deno.land/std@$STD_VERSION/io/buffer.ts";
import { copy } from "https://deno.land/std@$STD_VERSION/io/util.ts";

const tar = new Tar();
const content = new TextEncoder().encode("Deno.land");
await tar.append("deno.txt", {
  reader: new Buffer(content),
  contentSize: content.byteLength,
});

// Or specifying a filePath.
await tar.append("land.txt", {
  filePath: "./land.txt",
});

// use tar.getReader() to read the contents.

const writer = await Deno.open("./out.tar", { write: true, create: true });
await copy(tar.getReader(), writer);
writer.close();
```

## Untar

```ts
import { Untar } from "https://deno.land/std@$STD_VERSION/archive/tar.ts";
import { ensureFile } from "https://deno.land/std@$STD_VERSION/fs/ensure_file.ts";
import { ensureDir } from "https://deno.land/std@$STD_VERSION/fs/ensure_dir.ts";
import { copy } from "https://deno.land/std@$STD_VERSION/io/util.ts";

const reader = await Deno.open("./out.tar", { read: true });
const untar = new Untar(reader);

for await (const entry of untar) {
  console.log(entry); // metadata
  /*
    fileName: "archive/deno.txt",
    fileMode: 33204,
    mtime: 1591657305,
    uid: 0,
    gid: 0,
    size: 24400,
    type: 'file'
  */

  if (entry.type === "directory") {
    await ensureDir(entry.fileName);
    continue;
  }

  await ensureFile(entry.fileName);
  const file = await Deno.open(entry.fileName, { write: true });
  // <entry> is a reader.
  await copy(entry, file);
}
reader.close();
```
