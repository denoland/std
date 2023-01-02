// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { fromFileUrl } from "../path/mod.ts";
import { ensureFile } from "../fs/ensure_file.ts";

/** Download the file at the given url to the given path.  */
export async function downloadFile(url: string, fileUrl: URL) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  } else if (!response.body) {
    throw new Error(
      `The requested download url ${url} doesn't contain an archive to download`,
    );
  } else if (response.status === 404) {
    throw new Error(
      `The requested url "${url}" could not be found`,
    );
  }

  await ensureFile(fromFileUrl(fileUrl));
  const file = await Deno.open(fileUrl, { truncate: true, write: true });
  await response.body.pipeTo(file.writable);
}
