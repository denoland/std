// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

module.exports = [
  null,
  {
    empty: null,
    canonical: null,
    english: null,
    'null': 'null key'
  },
  {
    sparse: [
      null,
      '2nd entry',
      null,
      '4th entry',
      null
    ]
  }
];
