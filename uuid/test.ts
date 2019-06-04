#!/usr/bin/env deno run
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { runTests } from "https://deno.land/std/testing/mod.ts";

// Generic Tests
import "./tests/isNil.ts";
import "./tests/generate.ts";

// V4 Tests
import "./tests/v4/validate.ts";
import "./tests/v4/generate.ts";

runTests();
