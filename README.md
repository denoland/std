# Deno Standard Library

[![JSR @std](https://jsr.io/badges/@std)](https://jsr.io/@std)
[![codecov](https://codecov.io/gh/denoland/std/branch/main/graph/badge.svg?token=w6s3ODtULz)](https://codecov.io/gh/denoland/std)
[![ci](https://github.com/denoland/std/actions/workflows/ci.yml/badge.svg)](https://github.com/denoland/std/actions/workflows/ci.yml)

High-quality APIs for [Deno](https://deno.com/) and the web. Use fearlessly.

> [!IMPORTANT]
> Newer versions of the Standard Library are now hosted on
> [JSR](https://jsr.io/@std). Older versions up till 0.224.0 are still available
> at [deno.land/std](https://deno.land/std).

## Resources

- [Package list](https://jsr.io/@std)
- [Architecture guide](./.github/ARCHITECTURE.md)
- [Design documentation](.github/ARCHITECTURE.md#design)
- [Contributing guidelines](.github/CONTRIBUTING.md)
- [Frequently asked questions (FAQ)](./.github/FAQ.md)

## Using the Standard Library in a browser

Standard Library packages are published as TypeScript on JSR. Bundle them into
JavaScript before loading them in a browser. For example, create an entry point:

```ts
// main.ts
import { encodeBase64 } from "jsr:@std/encoding@^1.0.11/base64";

document.body.textContent = encodeBase64("Hello from @std!");
```

Then bundle it with
[`esbuild-deno-loader`](https://jsr.io/@luca/esbuild-deno-loader), which teaches
esbuild how to resolve Deno, JSR, and import-map specifiers:

```ts
// build.ts
import * as esbuild from "npm:esbuild@^0.28.2";
import { denoPlugins } from "jsr:@luca/esbuild-deno-loader@^0.11.1";

await esbuild.build({
  plugins: [...denoPlugins()],
  entryPoints: ["main.ts"],
  outfile: "dist/main.js",
  bundle: true,
  format: "esm",
});

esbuild.stop();
```

Run `deno run -A build.ts`, then load `dist/main.js` from an HTML module script:

```html
<script type="module" src="./dist/main.js"></script>
```

Only use modules whose source contains the
`// This module is browser compatible.` declaration. Other modules may depend on
Deno or Node.js APIs that are unavailable in browsers. When using a `deno.json`
import map, keep it beside the entry point so the loader discovers it, or pass
its path through the loader's `configPath` option.

## Releases

Package versions >=1.0.0 follow [Semantic Versioning](https://semver.org/), and
package versions <1.0.0 follow
[this proposal](https://github.com/semver/semver/pull/923).

## Badge

> [!NOTE]
> Previously, this repo hosted the badge SVG file. Now, the badge is retrieved
> directly from [Shields.io](https://shields.io/).

[![Built with the Deno Standard Library](https://img.shields.io/badge/Built_with_std-black?logo=deno)](https://jsr.io/@std)

```html
<a href="https://jsr.io/@std">
  <img
    width="135"
    height="20"
    src="https://img.shields.io/badge/Built_with_std-black?logo=deno"
    alt="Built with the Deno Standard Library"
  />
</a>
```

```md
[![Built with the Deno Standard Library](https://img.shields.io/badge/Built_with_std-black?logo=deno)](https://jsr.io/@std)
```
