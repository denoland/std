// Copyright 2023 the Deno authors. All rights reserved. MIT license.

export function getCursor(url: URL) {
  return url.searchParams.get("cursor") ?? "";
}
