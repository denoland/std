// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
const file = await Deno.open(new URL("./db.json", import.meta.url), {
  write: true,
  create: true,
  createNew: true,
});
const response = await fetch(
  "https://raw.githubusercontent.com/jshttp/mime-db/master/db.json",
);

await response.body?.pipeTo(file.writable);
