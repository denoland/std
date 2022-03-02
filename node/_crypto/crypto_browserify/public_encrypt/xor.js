// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright 2017 Calvin Metcalf. All rights reserved. MIT license.

export function xor(a, b) {
  var len = a.length;
  var i = -1;
  while (++i < len) {
    a[i] ^= b[i];
  }
  return a;
}
