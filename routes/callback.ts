// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers } from "$fresh/server.ts";
import { oauth2Client } from "@/utils/auth.ts";
import { kv } from "@/utils/db.ts";
import { deleteCookie, getCookies, setCookie } from "std/http/cookie.ts";
import type { AuthorizationCodeTokenOptions } from "oauth2_client";
import { redirect } from "@/utils/http.ts";
import {
  OAUTH_SESSION_COOKIE_NAME,
  OAUTH_SESSION_KV_PREFIX,
} from "@/utils/auth.ts";
import { createUser } from "@/utils/db.ts";
import { stripe } from "../utils/payments.ts";

interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  email: string;
}

async function getUser(accessToken: string): Promise<GitHubUser> {
  const response = await fetch("https://api.github.com/user", {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error();
  }
  return await response.json() as GitHubUser;
}

export const handler: Handlers = {
  async GET(req) {
    console.log(true);
    const oauthSessionId = getCookies(req.headers)[OAUTH_SESSION_COOKIE_NAME];

    if (!oauthSessionId) {
      throw new Error();
    }

    const oauthSessionRes = await kv.get<AuthorizationCodeTokenOptions>([
      OAUTH_SESSION_KV_PREFIX,
      oauthSessionId,
    ]);
    const oauthSession = oauthSessionRes.value;
    await await kv.delete([OAUTH_SESSION_KV_PREFIX, oauthSessionId]);

    if (!oauthSession) {
      throw new Deno.errors.NotFound("No OAuth session found");
    }

    const tokens = await oauth2Client.code.getToken(req.url, oauthSession);
    const user = await getUser(tokens.accessToken);
    const sessionId = crypto.randomUUID();

    const customer = await stripe.customers.create({ email: user.email });

    await createUser({
      id: user.id.toString(),
      login: user.login,
      avatarUrl: user.avatar_url,
      stripeCustomerId: customer.id,
    }, sessionId);

    const res = redirect("/");
    deleteCookie(res.headers, "oauth-session");
    setCookie(res.headers, {
      name: "session",
      value: sessionId,
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return res;
  },
};
