const { build } = Deno;

import { EOL } from "./eol.ts";

export const isWindows = build.os === "win";
export const EOL_ = isWindows ? EOL.CRLF : EOL.LF;
