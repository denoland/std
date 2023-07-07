// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This is an example of a server that responds with an empty body

Deno.serve({ port: 4505 }, () => new Response());
