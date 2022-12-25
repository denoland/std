// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright Sindre Sorhus and chalk/supports-color contributors. All rights reserved. MIT license.
import { parse } from "../flags/mod.ts";

export interface SupportsColorOptions {
  streamIsTTY?: boolean;
  sniffFlags?: boolean;
  args?: string[];
  os?: typeof Deno.build.os;
  osRelease?: string;
}

function envForceColor() {
  const FORCE_COLOR = Deno.env.get("FORCE_COLOR");

  if (FORCE_COLOR) {
    if (FORCE_COLOR === "true") {
      return 1;
    }

    if (FORCE_COLOR === "false") {
      return 0;
    }

    return FORCE_COLOR.length === 0
      ? 1
      : Math.min(Number.parseInt(FORCE_COLOR, 10), 3);
  }
}

function translateLevel(level: number) {
  return {
    level,
    hasBasic: level >= 1,
    has256: level >= 2,
    has16m: level >= 3,
  };
}

function _supportsColor(
  haveWriter?: {
    readonly rid: number;
  },
  {
    streamIsTTY,
    sniffFlags = true,
    args = Deno.args,
    os = Deno.build.os,
    osRelease = Deno.osRelease(),
  }: SupportsColorOptions = {},
) {
  // Read flags to see if anything matches to force colors or to force no colors
  const { _, color, colors } = parse(args, {
    string: ["color", "colors"],
    negatable: ["color", "colors"],
  });

  // console.log(color === "", colors)

  let flagForceColor: number | undefined;
  if (
    color === false ||
    colors === false ||
    color === "false" ||
    color === "never"
  ) {
    flagForceColor = 0;
  } else if (
    color === "" || // --color with no arguments results in this
    colors === "" || // --colors with no arguments results in this
    color === "true" ||
    color === "always"
  ) {
    flagForceColor = 1;
  }

  // Read environment variables to see if anything forces colors or to force no colors
  const noFlagForceColor = envForceColor();
  if (noFlagForceColor !== undefined) {
    flagForceColor = noFlagForceColor;
  }

  // The final value for colors being forced or not
  const forceColor = sniffFlags ? flagForceColor : noFlagForceColor;

  // If we force no colors, return no color
  if (forceColor === 0) {
    return 0;
  }

  // If we sniff flags, look through the flags to see if we are forcing certain colors
  if (sniffFlags) {
    if (
      color === "16m" ||
      color === "full" ||
      color === "truecolor"
    ) {
      return 3;
    }

    if (color === "256") {
      return 2;
    }
  }

  // Check for Azure DevOps pipelines.
  // Has to be above the `!streamIsTTY` check.
  if ("TF_BUILD" in Deno.env && "AGENT_NAME" in Deno.env) {
    return 1;
  }

  // If we aren't a TTY and we aren't forcing color then show no colors
  if (haveWriter && !streamIsTTY && forceColor === undefined) {
    return 0;
  }

  const min = forceColor || 0;

  if (Deno.env.get("TERM") === "dumb") {
    return min;
  }

  if (os === "windows") {
    // Windows 10 build 10586 is the first Windows release that supports 256 colors.
    // Windows 10 build 14931 is the first release that supports 16m/TrueColor.
    const release = osRelease.split(".");
    if (
      Number(release[0]) >= 10 &&
      Number(release[2]) >= 10_586
    ) {
      return Number(release[2]) >= 14_931 ? 3 : 2;
    }

    return 1;
  }

  if (Deno.env.get("CI")) {
    if (Deno.env.get("GITHUB_ACTIONS")) {
      return 3;
    }

    if (
      ["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "BUILDKITE", "DRONE"]
        .some((sign) => Deno.env.get(sign) !== undefined) ||
      Deno.env.get("CI_NAME") === "codeship"
    ) {
      return 1;
    }

    return min;
  }

  if (Deno.env.get("TEAMCITY_VERSION")) {
    return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(
        Deno.env.get("TEAMCITY_VERSION") ?? "",
      )
      ? 1
      : 0;
  }

  if (Deno.env.get("COLORTERM") === "truecolor") {
    return 3;
  }

  if (Deno.env.get("TERM") === "xterm-kitty") {
    return 3;
  }

  if (Deno.env.get("TERM_PROGRAM")) {
    const version = Number.parseInt(
      (Deno.env.get("TERM_PROGRAM_VERSION") || "").split(".")[0],
      10,
    );

    switch (Deno.env.get("TERM_PROGRAM")) {
      case "iTerm.app": {
        return version >= 3 ? 3 : 2;
      }

      case "Apple_Terminal": {
        return 2;
      }
        // No default
    }
  }

  if (/-256(color)?$/i.test(Deno.env.get("TERM") ?? "")) {
    return 2;
  }

  if (
    /^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(
      Deno.env.get("TERM") ?? "",
    )
  ) {
    return 1;
  }

  if (Deno.env.get("COLORTERM")) {
    return 1;
  }

  return min;
}

export function createSupportsColor(
  writer: {
    readonly rid: number;
  },
  options: SupportsColorOptions = {},
) {
  const level = _supportsColor(writer, {
    streamIsTTY: writer && Deno.isatty(writer.rid),
    ...options,
  });

  return translateLevel(level);
}

const supportsColor = {
  stdout: createSupportsColor(Deno.stdout),
  stderr: createSupportsColor(Deno.stderr),
};

export default supportsColor;
