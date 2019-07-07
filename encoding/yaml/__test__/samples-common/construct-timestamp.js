// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

module.exports = {
  canonical:        new Date(Date.UTC(2001, 11, 15, 2, 59, 43, 100)),
  'valid iso8601':    new Date(Date.UTC(2001, 11, 15, 2, 59, 43, 100)),
  'space separated':  new Date(Date.UTC(2001, 11, 15, 2, 59, 43, 100)),
  'no time zone (Z)': new Date(Date.UTC(2001, 11, 15, 2, 59, 43, 100)),
  'date (00:00:00Z)': new Date(Date.UTC(2002, 11, 14)),
  'not a date': '2002-1-1'
};
