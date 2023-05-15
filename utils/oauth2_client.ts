// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { OAuth2Client } from "https://deno.land/x/oauth2_client@v1.0.0/mod.ts";

export const oauth2Client = new OAuth2Client({
  clientId: Deno.env.get("GITHUB_CLIENT_ID")!,
  clientSecret: Deno.env.get("GITHUB_CLIENT_SECRET")!,
  authorizationEndpointUri: "https://github.com/login/oauth/authorize",
  tokenUri: "https://github.com/login/oauth/access_token",
  defaults: {
    scope: "read:user",
  },
});
