// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
export function secondInterval(cb: () => void): number {
  return setInterval(cb, 1000);
}
