// Copyright 2018-2025 the Deno authors. MIT license.
// Copyright (c) 2012 Ecma International.  All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
es5id: 15.12.1.1-g1-2
description: The JSON lexical grammar treats <CR> as a whitespace character
---*/

assert.sameValue(JSON.parse('\r1234'), 1234, '<cr> should be ignored');

assert.throws(SyntaxError, function() {
    JSON.parse('12\r34');
}, '<CR> should produce a syntax error as whitespace results in two tokens');
