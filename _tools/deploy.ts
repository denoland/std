// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This file tests the compatibility of std/node with Deno Deploy.
import { serve } from "../http/server.ts";
import "../node/module_all.ts";

serve(() => new Response("ok"));
