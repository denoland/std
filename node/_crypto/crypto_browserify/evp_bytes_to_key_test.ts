// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright 2017 crypto-browserify. All rights reserved. MIT license.

import { assertThrows } from "../../../testing/asserts.ts";
import { EVP_BytesToKey } from "./evp_bytes_to_key.ts";
import { Buffer } from "../../buffer.ts";

Deno.test("salt buffer length is 7", function () {
  assertThrows(
    function () {
      EVP_BytesToKey(Buffer.alloc(5), Buffer.alloc(7), 1, 1);
    },
    undefined,
    "salt should be Buffer with 8 byte length",
  );
});
