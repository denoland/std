// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers } from "$fresh/server.ts";
import { redirect } from "@/utils/http.ts";
import {
  createUser,
  getUserById,
  setUserSessionId,
  type User,
} from "@/utils/db.ts";
import { stripe } from "@/utils/payments.ts";
import { State } from "./_middleware.ts";
import { getAccessToken, setCallbackHeaders } from "@/utils/deno_kv_auth.ts";
import { oauth2Client } from "@/utils/oauth2_client.ts";
import { assert } from "https://deno.land/std@0.178.0/_util/asserts.ts";

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

// deno-lint-ignore no-explicit-any
export const handler: Handlers<any, State> = {
  async GET(req) {
    const accessToken = await getAccessToken(req, oauth2Client);
    const githubUser = await getUser(accessToken);
    const sessionId = crypto.randomUUID();

    const customer = await stripe.customers.create({ email: githubUser.email });
    let user: Omit<User, "isSubscribed"> | null = {
      id: githubUser.id.toString(),
      login: githubUser.login,
      avatarUrl: githubUser.avatar_url,
      stripeCustomerId: customer.id,
      sessionId,
    };

    /** @todo Clean this up */
    try {
      await createUser(user);
    } catch {
      user = await getUserById(user.id);
      assert(user, `User not found`);
      await setUserSessionId(user, sessionId);
    }

    const response = redirect("/");
    setCallbackHeaders(response.headers, sessionId);
    return response;
  },
};
