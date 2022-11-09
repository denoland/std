// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

/** Basic CLI to fetch URLs and log body to console.
 *
 * @module
 */

const url_ = Deno.args[0];
const res = await fetch(url_);

await res.body?.pipeTo(Deno.stdout.writable);
