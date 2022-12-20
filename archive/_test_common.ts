// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { dirname, fromFileUrl, resolve } from "../path/mod.ts";

const moduleDir = dirname(fromFileUrl(import.meta.url));
export const testdataDir = resolve(moduleDir, "testdata");
export const filePath = resolve(testdataDir, "example.txt");
