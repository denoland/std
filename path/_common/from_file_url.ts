// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

export function assertFileUrl(url: URL) {
  if (url.protocol !== "file:") throw new TypeError("URL must be a file URL");
}
