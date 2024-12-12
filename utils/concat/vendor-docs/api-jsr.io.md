---
title: API
description: JSR uses a simple HTTP + JSON API to interact with the registry and download packages.
---

JSR has three APIs that you can interact with:

- The [JSR registry API](#jsr-registry-api), which is used to download modules
  and package metadata. This is used when a runtime or tool supports native
  `jsr:` specifiers.
- The [npm compatibility registry API](#npm-compatibility-registry-api), which
  is an npm compatible registry endpoint for package managers using
  [JSR's npm compatibility layer](/docs/npm-compatibility).
- The [management API](#management-api) which allows you to publish packages,
  manage your scopes, and retrieve account information.

## JSR registry API

The JSR registry API is used to download modules (individual JS/TS files in a
package), package version metadata, and package metadata.

> NOTE: All requests to the JSR registry API must be made with an `Accept`
> header that does **not** include `text/html`, and requests must not specify
> `Sec-Fetch-Dest: document`. When fetching with `Accept: text/html`, the
> registry may return an HTML page with a rendered version of the underlying
> data.

### Modules

Modules are served using standard HTTP GET requests as would be initiated by a
browser `import` statement. Modules are served from the `https://jsr.io` domain,
at the following URL:

```
https://jsr.io/@<scope>/<package-name>/<version>/<path>
```

For example, the `/main.ts` file of the `@luca/flag` package version `1.0.0`
would be served at the following URL:

```
https://jsr.io/@luca/flag/1.0.0/main.ts
```

Modules are immutable, so they can be cached indefinitely. The registry
understands conditional requests, so will appropriately respond with
`304 Not Modified` when `If-No-Match` or `If-Modified-Since` headers are
provided.

### Package metadata

Package metadata refers to the information about a package as a whole, such as
the package scope, name and versions. Package metadata is served as JSON at the
following URL:

```
https://jsr.io/@<scope>/<package-name>/meta.json
```

For example, the metadata for the `@luca/flag` package would be served at the
following URL:

```
https://jsr.io/@luca/flag/meta.json
```

This metadata contains a list of published versions for the package. This allows
a tool to discover the available versions of a package and perform semantic
versioning resolution to determine the best version to use.

Each version in the metadata contains information about the version, such as the
yanked status, and the `exports` field for the package version. The `exports`
field is normalized to simple object form.

For the above `@luca/flag` package, the metadata would look like this:

```json
{
  "scope": "luca",
  "name": "flag",
  "versions": {
    "1.0.0": {
      "yanked": true
    },
    "1.0.1": {}
  }
}
```

### Package version metadata

Package version metadata refers to the information about a specific version of a
package.

Version metadata is served as JSON at the following URL:

```
https://jsr.io/@<scope>/<package-name>/<version>_meta.json
```

For example, the metadata for the `@luca/flag` package version `1.0.0` would be
served at the following URL:

```
https://jsr.io/@luca/flag/1.0.0_meta.json
```

This metadata contains information about the requested version, such as the list
of files in the package version, the `exports` field, and a `moduleGraph1` or
`moduleGraph2` field that contains information about the module graph to allow
for less waterfall when downloading modules.

For the above `@luca/flag` package version `1.0.0`, the metadata would look like
this:

```json
{
  "manifest": {
    "/deno.json": {
      "size": 75,
      "checksum": "sha256-98719bf861369684be254b01f1427084dc6d16b506809719122890784542496b"
    },
    "/LICENSE": {
      "size": 1070,
      "checksum": "sha256-c3f0644e8374585b209ea5206ab88055c1c503c202bff5d1f01bb29c07041fbb"
    },
    "/README.md": {
      "size": 279,
      "checksum": "sha256-f544a1489e93e93957d6bd03f069e0db7a9bef4af6eeae46a86b4e3316e598c3"
    },
    "/main.ts": {
      "size": 2989,
      "checksum": "sha256-a41796ceb0be1bca3aa446ddebebcd732492ccb2cdcb8912adbabef3375fafc8"
    }
  },
  "moduleGraph1": {
    "/main.ts": {}
  },
  "exports": {
    ".": "./main.ts"
  }
}
```

The version metadata field is immutable, so it can be cached indefinitely.
Because of this immutability, the `yanked` field is not included in the version
metadata. Instead, retrieve yanked status from the package metadata.

## npm compatibility registry API

The npm compatibility registry API is used to download npm compatible tarballs
for JSR packages, and to retrieve npm compatible package metadata.

[Learn more about the npm compatibility layer.](/docs/npm-compatibility)

The npm compatibility registry API is served from the `https://npm.jsr.io`
domain.

The entrypoint to the npm compatibility registry API is the package metadata
endpoint. For example, the metadata for the `@luca/flag` package on JSR (with
compatibility name `@jsr/luca__flag`) is served at the following URL:

```
https://npm.jsr.io/@jsr/luca__flag
```

This returns an npm compatible package metadata object, with the following
fields:

- `name`: The npm compatibility name of the package.
- `description`: The package description.
- `dist-tags`: The `latest` version of the package.
- `versions`: A map of versions to version metadata.
- `time`: A map of versions to publish timestamps.

The `versions` field is a map of versions to version metadata. The version
metadata is an npm compatible version metadata object, with the following
fields:

- `name`: The npm compatibility name of the package.
- `version`: The version of the package.
- `description`: The package description.
- `dist`: The `dist` field for the package version. This contains the tarball
  URL for the package version, and the checksums / integrity hashes for the
  tarball.
- `dependencies`: The `dependencies` of the package version.

Yanked versions are not included in the `versions` field, and are never
referenced from the `latest` dist-tag.

> Note: The data served from the npm compatibility registry API may not always
> be up to date or consistent with the data served from the JSR registry API.
> Versions may be missing, or the `latest` dist-tag may be out of date.
> Generally this resolves itself within a few minutes.

## Management API

The management API is used to publish packages, manage your scopes, and retrieve
account information.

The management API is served from the `https://api.jsr.io` domain. It is a REST
API that uses JSON for serialization.

Many requests to the management API require authentication. Authentication is
done using an `Authorization` header with a `Bearer` or `githuboidc` token.

### Authentication tokens

JSR supports authenticating with three types of tokens:

- Short-lived device access tokens, which are used to authenticate as a user.
  These tokens are authenticated by the user interactively, and are only valid
  for one specific purpose for a short period of time.

- Long-lived personal access tokens, which are used to authenticate as a user.
  Personal access tokens may have an expiration date, and may grant only limited
  permissions. Personal access tokens can be created on the JSR account settings
  page in the "Tokens" tab.

- GitHub Actions OIDC tokens, which are used to authenticate as a GitHub Actions
  runner. These tokens are created from within GitHub Actions, and are only
  valid for a short period of time. They can only be used to publish packages.

Both device access tokens, and personal access tokens are passed in the
`Authorization` header with a `Bearer` prefix. GitHub Actions OIDC tokens are
passed in the `Authorization` header with a `githuboidc` prefix.

```http
Authorization: Bearer jsrd_5gVEGU852nnRH2opZeP9uZ1UdNXog0fcvP8
Authorization: Bearer jsrp_Kj0yFdcksJqHPm04l5tic2WXVtaLS2292b2
Authorization: githuboidc eyJhbGciOiJSUzI1NiIsImtpZCI6IjEwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMCJ9.eyJyZXBvIjoibHVjYWNhc29uYXRvL2ZsYWciLCJkaWQiOiAieW91IHJlYWxseSB0aGluayBpIHdhcyBnb2luZyB0byBnaXZlIHlvdSBhIHZhbGlkIHRva2VuPyJ9.ZXlKeVpYQnZJam9pYkhWallXTmhjMjl1WVhSdkwyWnNZV2NpTENKa2FXUWlPaUFpZVc5MU
```

### Permissions

The management API has various permissions that can be granted to tokens. These
permissions are:

- `package/publish`: Only allows publishing a specific package, possibly at a
  specific version.
- _all_: Allows all actions with the exception of token management.

GitHub Actions OIDC tokens only support the `package/publish` permission, with a
specific package and version specified.

### Endpoints

An OpenAPI 3.0 specification for the management API is available at
https://api.jsr.io/.well-known/openapi.

A rendered version of the OpenAPI specification is available at
[/docs/api-reference](/docs/api-reference).

### Usage restrictions

The management API should not be used during registry operations. You should not
retrieve the list of versions for a package, or the metadata for a package
version, from the management API. Instead, use the JSR registry API or the npm
compatibility registry API.

The management API is intended for use by tools and services that need to
interact with the registry on behalf of a user. For example, a tool that
publishes packages to JSR on behalf of a user would use the management API to
publish packages.

Tools should identify themselves using the `User-Agent` header. The `User-Agent`
header should be in the following format:

```
<tool-name>/<tool-version>; <tool-url>
```

If a tool is misbehaving, we may block it from using the management API.

If you are not sure whether the management API is appropriate for your use case,
please contact us at help@jsr.io.
