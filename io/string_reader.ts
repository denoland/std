// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Based on https://github.com/golang/go/blob/0452f9460f50f0f0aba18df43dc2b31906fb66cc/src/io/io.go
// Copyright 2009 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

import { Buffer } from "./buffer.ts";

/** Reader utility for strings */
export class StringReader extends Buffer {
  constructor(s: string) {
    super(new TextEncoder().encode(s).buffer);
  }
}
