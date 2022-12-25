// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright Sindre Sorhus and chalk/supports-color contributors. All rights reserved. MIT license.
import {
  assert,
  assertEquals,
  assertFalse,
  assertNotEquals,
} from "../testing/asserts.ts";
import { createSupportsColor } from "./supports_color.ts";

// Remove all environment variables for testing
function cleanEnv() {
  for (const key of Object.keys(Deno.env.toObject())) {
    Deno.env.delete(key);
  }
}

Deno.test("return true if `FORCE_COLOR` is in env", () => {
  cleanEnv();
  Deno.env.set("FORCE_COLOR", "true");
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: false,
  });
  assertEquals(result.level, 1);
});

Deno.test("return true if `FORCE_COLOR` is in env, but honor 256", () => {
  cleanEnv();
  Deno.env.set("FORCE_COLOR", "true");

  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
    args: ["--color=256"],
  });
  assertEquals(result.level, 2);
});

Deno.test("return true if `FORCE_COLOR` is in env, but honor 256 #2", () => {
  cleanEnv();
  Deno.env.set("FORCE_COLOR", "1");

  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
    args: ["--color=256"],
  });
  assertEquals(result.level, 2);
});

Deno.test("return false if `FORCE_COLOR` is in env and is 0", () => {
  cleanEnv();

  Deno.env.set("FORCE_COLOR", "0");

  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
  });
  assertEquals(result.level, 0);
});

Deno.test("do not cache `FORCE_COLOR`", () => {
  cleanEnv();

  Deno.env.set("FORCE_COLOR", "0");

  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
  });
  assertEquals(result.level, 0);

  Deno.env.set("FORCE_COLOR", "1");
  const updatedResult = createSupportsColor(Deno.stdout);
  assertNotEquals(updatedResult.level, 0);
});

Deno.test("return false if not TTY", () => {
  cleanEnv();
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: false,
  });
  assertEquals(result.level, 0);
});

Deno.test("return false if --no-color flag is used", () => {
  cleanEnv();
  Deno.env.set("TERM", "xterm-256color");
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
    args: ["--no-color"],
  });
  assertEquals(result.level, 0);
});

Deno.test("return false if --no-colors flag is used", () => {
  cleanEnv();
  Deno.env.set("TERM", "xterm-256color");
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
    args: ["--no-color"],
  });
  assertEquals(result.level, 0);
});

Deno.test("return true if --color flag is used", () => {
  cleanEnv();
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
    args: ["--color"],
  });
  assertNotEquals(result.level, 0);
});

Deno.test("return true if --colors flag is used", () => {
  cleanEnv();
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
    args: ["--colors"],
  });
  assertNotEquals(result.level, 0);
});

Deno.test("return true if `COLORTERM` is in env", () => {
  cleanEnv();
  Deno.env.set("COLORTERM", "true");
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
  });
  assertNotEquals(result.level, 0);
});

Deno.test("support `--color=true` flag", () => {
  cleanEnv();
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
    args: ["--color=true"],
  });
  assertNotEquals(result.level, 0);
});

Deno.test("support `--color=always` flag", () => {
  cleanEnv();
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
    args: ["--color=always"],
  });
  assertNotEquals(result.level, 0);
});

Deno.test("support `--color=false` flag", () => {
  cleanEnv();
  Deno.env.set("TERM", "xterm-256color");
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
    args: ["--color=false"],
  });
  assertEquals(result.level, 0);
});

Deno.test("support `--color=256` flag", () => {
  cleanEnv();
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
    args: ["--color=256"],
  });
  assertNotEquals(result.level, 0);
});

Deno.test("level should be 2 if `--color=256` flag is used", () => {
  cleanEnv();
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
    args: ["--color=256"],
  });
  assertEquals(result.level, 2);
  assert(result.has256);
});

Deno.test("support `--color=16m` flag", () => {
  cleanEnv();
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
    args: ["--color=16m"],
  });
  assertNotEquals(result.level, 0);
});

Deno.test("support `--color=full` flag", () => {
  cleanEnv();
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
    args: ["--color=full"],
  });
  assertNotEquals(result.level, 0);
});

Deno.test("support `--color=truecolor` flag", () => {
  cleanEnv();
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
    args: ["--color=truecolor"],
  });
  assertNotEquals(result.level, 0);
});

Deno.test("level should be 3 if `--color=16m` flag is used", () => {
  cleanEnv();
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
    args: ["--color=16m"],
  });
  assertEquals(result.level, 3);
  assert(result.has256);
  assert(result.has16m);
});

Deno.test("ignore post-terminator flags", () => {
  cleanEnv();
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
    args: ["--color", "--", "--no-color"],
  });
  assertNotEquals(result.level, 0);
});

Deno.test("allow tests of the properties on false", () => {
  cleanEnv();
  Deno.env.set("TERM", "xterm-256color");
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
    args: ["--no-color"],
  });
  assertEquals(result.hasBasic, false);
  assertEquals(result.has256, false);
  assertEquals(result.has16m, false);
  assertFalse(result.level > 0);
});

Deno.test("return false if `CI` is in env", () => {
  cleanEnv();
  Deno.env.set("CI", "AppVeyor");
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
  });
  assertEquals(result.level, 0);
});

Deno.test("return true if `TRAVIS` is in env", () => {
  cleanEnv();
  Deno.env.set("CI", "Travis");
  Deno.env.set("TRAVIS", "1");
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
  });
  assertNotEquals(result.level, 0);
});

Deno.test("return true if `CIRCLECI` is in env", () => {
  cleanEnv();
  Deno.env.set("CI", "true");
  Deno.env.set("CIRCLECI", "true");
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
  });
  assertNotEquals(result.level, 0);
});

Deno.test("return true if `APPVEYOR` is in env", () => {
  cleanEnv();
  Deno.env.set("CI", "true");
  Deno.env.set("APPVEYOR", "true");
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
  });
  assertNotEquals(result.level, 0);
});

Deno.test("return true if `GITLAB_CI` is in env", () => {
  cleanEnv();
  Deno.env.set("CI", "true");
  Deno.env.set("GITLAB_CI", "true");
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
  });
  assertNotEquals(result.level, 0);
});

Deno.test("return true if `BUILDKITE` is in env", () => {
  cleanEnv();
  Deno.env.set("CI", "true");
  Deno.env.set("BUILDKITE", "true");
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
  });
  assertNotEquals(result.level, 0);
});

Deno.test("return true if `DRONE` is in env", () => {
  cleanEnv();
  Deno.env.set("CI", "true");
  Deno.env.set("DRONE", "true");
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
  });
  assertNotEquals(result.level, 0);
});

Deno.test("return true if Codeship is in env", () => {
  cleanEnv();
  Deno.env.set("CI", "true");
  Deno.env.set("CI_NAME", "codeship");
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
  });
  assertNotEquals(result.level, 0);
});

Deno.test("return false if `TEAMCITY_VERSION` is in env and is < 9.1", () => {
  cleanEnv();
  Deno.env.set("TEAMCITY_VERSION", "9.0.5 (build 32523)");
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
  });
  assertEquals(result.level, 0);
});

Deno.test("return level 1 if `TEAMCITY_VERSION` is in env and is >= 9.1", () => {
  cleanEnv();
  Deno.env.set("TEAMCITY_VERSION", "9.1.0 (build 32523)");
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
  });
  assertEquals(result.level, 1);
});

Deno.test("support rxvt", () => {
  cleanEnv();
  Deno.env.set("TERM", "rxvt");
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
  });
  assertEquals(result.level, 1);
});

Deno.test("prefer level 2/xterm over COLORTERM", () => {
  cleanEnv();
  Deno.env.set("COLORTERM", "1");
  Deno.env.set("TERM", "xterm-256color");
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
  });
  assertEquals(result.level, 2);
});

Deno.test("support screen-256color", () => {
  cleanEnv();
  Deno.env.set("TERM", "screen-256color");
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
  });
  assertEquals(result.level, 2);
});

Deno.test("support putty-256color", () => {
  cleanEnv();
  Deno.env.set("TERM", "putty-256color");
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
  });
  assertEquals(result.level, 2);
});

Deno.test("level should be 3 when using iTerm 3.0", () => {
  cleanEnv();
  Deno.env.set("TERM_PROGRAM", "iTerm.app");
  Deno.env.set("TERM_PROGRAM_VERSION", "3.0.10");
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
  });
  assertEquals(result.level, 3);
});

Deno.test("level should be 2 when using iTerm 2.9", () => {
  cleanEnv();
  Deno.env.set("TERM_PROGRAM", "iTerm.app");
  Deno.env.set("TERM_PROGRAM_VERSION", "2.9.3");
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
  });
  assertEquals(result.level, 2);
});

Deno.test("return level 1 if on Windows earlier than 10 build 10586", () => {
  cleanEnv();
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
    os: "windows",
    osRelease: "10.0.10240",
  });
  assertEquals(result.level, 1);
});

Deno.test("return level 2 if on Windows 10 build 10586 or later", () => {
  cleanEnv();
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
    os: "windows",
    osRelease: "10.0.10586",
  });
  assertEquals(result.level, 2);
});

Deno.test("return level 3 if on Windows 10 build 14931 or later", () => {
  cleanEnv();
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
    os: "windows",
    osRelease: "10.0.14931",
  });
  assertEquals(result.level, 3);
});

Deno.test("return level 2 when FORCE_COLOR is set when not TTY in xterm256", () => {
  cleanEnv();
  Deno.env.set("FORCE_COLOR", "true");
  Deno.env.set("TERM", "xterm-256color");
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: false,
  });
  assertEquals(result.level, 2);
});

Deno.test("supports setting a color level using FORCE_COLOR", () => {
  cleanEnv();
  Deno.env.set("FORCE_COLOR", "1");
  let result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
  });
  assertEquals(result.level, 1);

  Deno.env.set("FORCE_COLOR", "2");
  result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
  });
  assertEquals(result.level, 2);

  Deno.env.set("FORCE_COLOR", "3");
  result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
  });
  assertEquals(result.level, 3);

  Deno.env.set("FORCE_COLOR", "0");
  result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
  });
  assertEquals(result.level, 0);
});

Deno.test("FORCE_COLOR maxes out at a value of 3", () => {
  cleanEnv();
  Deno.env.set("FORCE_COLOR", "4");
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
  });
  assertEquals(result.level, 3);
});

Deno.test("FORCE_COLOR works when set via command line (all values are strings)", () => {
  cleanEnv();
  Deno.env.set("FORCE_COLOR", "true");
  let result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
  });
  assertEquals(result.level, 1);

  Deno.env.set("FORCE_COLOR", "true");
  Deno.env.set("TERM", "xterm-256color");
  result = createSupportsColor(Deno.stdout, {
    streamIsTTY: false,
  });
  assertEquals(result.level, 2);

  Deno.env.set("FORCE_COLOR", "false");
  result = createSupportsColor(Deno.stdout, {
    streamIsTTY: false,
  });
  assertEquals(result.level, 0);
});

Deno.test("return false when `TERM` is set to dumb", () => {
  cleanEnv();
  Deno.env.set("TERM", "dumb");
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
  });
  assertEquals(result.level, 0);
});

Deno.test("return false when `TERM` is set to dumb when `TERM_PROGRAM` is set", () => {
  cleanEnv();
  Deno.env.set("TERM", "dumb");
  Deno.env.set("TERM_PROGRAM", "Apple_Terminal");
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
  });
  assertEquals(result.level, 0);
});

Deno.test("return false when `TERM` is set to dumb when run on Windows", () => {
  cleanEnv();
  Deno.env.set("TERM", "dumb");
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
    os: "windows",
    osRelease: "10.0.14931",
  });
  assertEquals(result.level, 0);
});

Deno.test("return level 1 when `TERM` is set to dumb when `FORCE_COLOR` is set", () => {
  cleanEnv();
  Deno.env.set("FORCE_COLOR", "1");
  Deno.env.set("TERM", "dumb");
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
  });
  assertEquals(result.level, 1);
});

Deno.test("ignore flags when sniffFlags=false", () => {
  cleanEnv();
  Deno.env.set("TERM", "dumb");
  const result = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
    args: ["--color=256"],
  });
  assertEquals(result.level, 2);

  const sniffResult = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
    sniffFlags: true,
    args: ["--color=256"],
  });
  assertEquals(sniffResult.level, 2);

  const noSniffResult = createSupportsColor(Deno.stdout, {
    streamIsTTY: true,
    sniffFlags: false,
    args: ["--color=256"],
  });
  assertEquals(noSniffResult.level, 0);
});
