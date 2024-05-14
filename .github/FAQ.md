# Frequently Asked Questions

## What is the Deno Standard Library?

The Deno Standard Library is a library of packages that aim to provide a robust,
secure, and modern foundation for building JavaScript and TypeScript
applications.

## Which APIs does the Standard Library support?

The Standard Library aims to compliment the
[JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference),
[Web](https://developer.mozilla.org/en-US/docs/Web/API) and
[Deno runtime](https://deno.land/api) APIs.

## Which runtimes are compatible with the Standard Library?

By virtue of the APIs it supports, the Standard Library primarily aims to work
with:

1. [Deno](https://deno.com/)
1. [Deno Deploy](https://deno.com/deploy)
1. Web browsers (i.e. [Google Chrome](https://www.google.com.au/chrome/),
   [Mozilla Firefox](https://www.mozilla.org/firefox/),
   [Apple Safari](https://www.apple.com/safari/), etc.)

Other runtimes are supported to varying degrees, depending on how much they
support the same APIs that the Standard Library targets. These runtimes include:

1. [Node.js](https://nodejs.org/)
1. [Cloudflare Workers](https://workers.cloudflare.com/)
1. [Bun](https://bun.sh/)

## How is the Standard Library distributed?

The Standard Library is distributed as a library of packages on
[JSR](https://jsr.io/), a modern package registry for JavaScript and TypeScript.

To learn more about JSR, see the [documentation](https://jsr.io/docs).

## Which version of a given package should I use?

We recommend using the latest version of a given package.

Thanks to JSR, you can constrain dependency versions by defining the SemVer
range in the import specifier.

E.g. If the latest major version of a package is 1, it should be imported as
follows:

```ts, ignore
import { bar } from "jsr:@std/foo@^1";
```

The same goes if the latest major version of a package is 0:

```ts, ignore
import { bar } from "jsr:@std/foo@^0";
```

This approach allows for bug fixes and new features, while avoiding breaking
changes.

For more information, see JSR's
[SemVer resolution](https://jsr.io/docs/using-packages#semver-resolution)
documentation.

## Why would an API be deprecated?

An API is deprecated due to one of the following reasons:

1. It's been covered by a new JavaScript language or Web Standard API.
1. It's been moved to a more appropriate location. E.g. To another package.
1. It's been renamed more appropriate. E.g. To a name that more clearly
   describes its behavior.
1. It's been deemed no longer fitting to the Standard Library.

## When is a deprecated API removed?

In almost all cases, a deprecated API is removed in the next major version after
deprecation. This is to minimize breaking changes for users.

## Can I still use a deprecated API?

Yes. You can use a package version that contains the deprecated API in question
by pinning the package version.

E.g. Say `bar()` is deprecated in `@std/foo@0` and removed in `@std/foo@1`. Pin
the import specifier to `@std/foo@0` to continued use:

```ts, ignore
import { bar } from "jsr:@std/foo@^0/bar";
```

This is possible thanks to JSR being immutable. For more information, see JSR's
[Immutability](https://jsr.io/docs/immutability) documentation.

## How can I contribute to the Standard Library?

Check out the contributing guidelines [here](CONTRIBUTING.md).

## How is the Standard Library codebase structured?

Check out the architecture guide [here](ARCHITECTURE.md).
