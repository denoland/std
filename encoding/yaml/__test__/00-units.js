// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

var path = require('path');
var fs   = require('fs');


suite('Units', function () {
  var directory = path.resolve(__dirname, 'units');

  fs.readdirSync(directory).forEach(function (file) {
    if (path.extname(file) === '.js') {
      require(path.resolve(directory, file));
    }
  });
});
