// Copyright 2018-2026 the Deno authors. MIT license.

import * as posix from "./posix/mod.ts";
import * as windows from "./windows/mod.ts";
import { assertEquals } from "@std/assert";

Deno.test("windows.toNamespacedPath() returns the namespaced path", () => {
  {
    const path = "C:\\path\\to\\file.txt";
    const namespacedPath = windows.toNamespacedPath(path);
    assertEquals(namespacedPath, "\\\\?\\C:\\path\\to\\file.txt");
  }

  // The path starts with double backslashs
  {
    const path = "\\\\path\\to\\file.txt";
    const namespacedPath = windows.toNamespacedPath(path);
    assertEquals(namespacedPath, "\\\\?\\UNC\\path\\to\\file.txt");
  }

  // When the input is empty string
  {
    const path = "";
    const namespacedPath = windows.toNamespacedPath(path);
    assertEquals(namespacedPath, "");
  }
});

Deno.test("posix.toNamespacedPath() return the input as is", () => {
  const path = "/path/to/file.txt";
  const namespacedPath = posix.toNamespacedPath(path);
  assertEquals(namespacedPath, "/path/to/file.txt");
});
