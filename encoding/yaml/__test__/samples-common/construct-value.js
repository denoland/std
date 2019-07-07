// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

module.exports = [
  {
    'link with': [
      'library1.dll',
      'library2.dll'
    ]
  },
  {
    'link with': [
      { '=': 'library1.dll', version: 1.2 },
      { '=': 'library2.dll', version: 2.3 }
    ]
  }
];
