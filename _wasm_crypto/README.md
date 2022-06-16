`std/_crypto_wasm` is only for internal use, such as by `std/crypto` and
`std/node/crypto`. Its interface may not be stable between releases and it
should not be imported directly.

## How to Build

### Build

```sh
deno task build:crypto
```

This will regenerate the files in the `./lib/` folder from the Rust source.
