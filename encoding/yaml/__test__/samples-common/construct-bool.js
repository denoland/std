// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

module.exports = {
  valid_true: [ true, true, true ],
  valid_false: [ false, false, false ],
  deprecated_true: [ 'y', 'Y', 'yes', 'Yes', 'YES', 'on', 'On', 'ON' ],
  deprecated_false: [ 'n', 'N', 'no', 'No', 'NO', 'off', 'Off', 'OFF' ]
};
