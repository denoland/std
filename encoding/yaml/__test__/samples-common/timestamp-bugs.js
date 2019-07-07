// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

module.exports = [
  new Date(Date.UTC(2001, 11, 15, 3, 29, 43, 100)),
  new Date(Date.UTC(2001, 11, 14, 16, 29, 43, 100)),
  new Date(Date.UTC(2001, 11, 14, 21, 59, 43, 1)),
  new Date(Date.UTC(2001, 11, 14, (21 - 1), 59, 43, 0)),
  new Date(Date.UTC(2001, 11, 14, (21 + 1), (59 + 30), 43, 0)),
  new Date(Date.UTC(2005, 6, 8, 17, 35, 4, 517))
];
