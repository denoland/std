// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { copy } from "../streams/conversion.ts";
const filenames = Deno.args;
for (const filename of filenames) {
  const file = await Deno.open(filename);
  await copy(file, Deno.stdout);
  file.close();
}
