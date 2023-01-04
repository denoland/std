// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Ported from test262
// https://github.com/tc39/test262/blob/488eb365db7c613d52e72a9f5b8726684906e540/harness/isConstructor.js
// Copyright (C) 2017 André Bargull. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
description: |
    Test if a given function is a constructor function.
defines: [isConstructor]
---*/

function isConstructor(f) {
    try {
        Reflect.construct(function(){}, [], f);
    } catch (e) {
        return false;
    }
    return true;
}
