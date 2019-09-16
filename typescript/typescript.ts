// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

// @deno-types="./vendor/typescript.d.ts"
import "./vendor/typescript.js";

import * as ts_ from "./vendor/typescript.d.ts";

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace ts {
        // @ts-ignore
        export = ts_;
    }
}
