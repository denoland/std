// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

/** An implementation of [`cat`](https://en.wikipedia.org/wiki/Cat_(Unix)).
 *
 * @module
 */

const filenames = Deno.args;
for (const filename of filenames) {
  const file = await Deno.open(filename);
  await file.readable.pipeTo(Deno.stdout.writable, { preventClose: true });
}
